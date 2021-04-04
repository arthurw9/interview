(function(path) {
  var url = path + "&z=" + Math.random();
  var script = document.createElement("script");
  script.src = url;
  document.head.appendChild(script);
  console.log("loading", url);
})("https://www.googletagmanager.com/gtag/js?id=G-8KY282RL6T");
window.dataLayer = window.dataLayer || [];
gtag = window.gtag || function() {dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-8KY282RL6T');
// TODO: Maybe move all top level symbols under a single object.
function ParseError(msg, token, model) {
  var idx = token[1];
  var text = model.text;
  throw "ERROR: " + msg +
        "\nidx = " + idx +
        "\n" + text.substr(0, idx + 1) + "/* Here */" +
        text.substr(idx + 1);
}
function ParseErrorPriorToken(msg, model) {
  var idx = model.token_idx - 1;
  if (idx < 0 || idx >= model.tokens.length) {
    idx = 0;
  }
  if (idx < model.tokens.length) {
    ParseError(msg, model.tokens[idx], model);
  } else {
    ParseError(msg, [0,0,0], model);
  }
}

var unique = {};
function CheckUnique(item) {
  if (unique.hasOwnProperty(item)) {
    throw "ERROR: duplicate internal term: [" + item + "]";
  }
  unique[item] = 1;
  return item;
}

var KEYWORDS = [];
function CheckUniqueKeyword(kwd) {
  CheckUnique(kwd);
  KEYWORDS.push(kwd);
  return kwd;
}

var FORM_KEYWORD = CheckUniqueKeyword("form");
var PAGE_KEYWORD = CheckUniqueKeyword("page");
var PRINT_KEYWORD = CheckUniqueKeyword("print");
var BUTTON_KEYWORD = CheckUniqueKeyword("button");
var INPUT_KEYWORD = CheckUniqueKeyword("input");

var WHITE_SPACE_TOKEN = CheckUnique("ws");
var IDENTIFIER_TOKEN = CheckUnique("id");
var COMMENT_TOKEN = CheckUnique("cmt");
var DIGITS_TOKEN = CheckUnique("dgt");
var STRING_TOKEN = CheckUnique("str");
var NUMBER_TOKEN = CheckUnique("num");
var SEMICOLON_TOKEN = CheckUnique(";");
// Other types of tokens have exactly 1 character

var START = CheckUnique("START");

function Tokenize(model) {
  var WHITE_SPACE = /\s/;
  var COMMENT_START = "/*";
  var COMMENT_END = "*/";
  var STRING_DELIM = "\"";
  var DIGIT = /[0-9]/;
  var DIGIT_OR_DOT = /[.0-9]/;
  var IDENTIFIER_1 = /[a-zA-Z_]/;
  var IDENTIFIER_2 = /[a-zA-Z_0-9]/;

  var tokens = [];  // list of tokens [type, start_idx, len]
  var idx = 0;
  var text = model.text;
  while (idx < text.length) {
    if (WHITE_SPACE.test(text[idx])) {
      var token = [];
      token[0] = WHITE_SPACE_TOKEN;
      token[1] = idx;
      while (idx < text.length && WHITE_SPACE.test(text[idx])) {
        ++idx;
      }
      token[2] = idx - token[1];
      tokens.push(token);
      continue;
    }
    if (IDENTIFIER_1.test(text[idx])) {
      var token = [];
      token[0] = IDENTIFIER_TOKEN;
      token[1] = idx;
      while (idx < text.length && IDENTIFIER_2.test(text[idx])) {
        ++idx;
      }
      // special string delimiters can look like this:
      // <id>"string body<id>"
      // This is a way to allow strings to contain quotes.
      // <id> should be chosen such that <id>" does not occur inside
      // the string body.
      if (idx < text.length && text[idx] == STRING_DELIM) {
        token[0] = STRING_TOKEN;
        // skip past the quote
        ++idx;
        // delim is <id>" delimiter?
        var delim_length = idx - token[1];
        var delim = text.substr(token[1], delim_length);
        // Find the next occurance of the delimiter.
        idx = text.indexOf(delim, idx);
        if (idx < 0) {
          ParseError("Closing delimiter expected: [" + delim + "]",
                     token, model)
        }
        // skip past the end delimiter
        idx += delim_length;
      }
      token[2] = idx - token[1];
      var token_str = text.substr(token[1], token[2]).toLowerCase();
      if (KEYWORDS.find(kwd => kwd == token_str)) {
        token[0] = token_str;
      }
      tokens.push(token);
      continue;
    }
    if (COMMENT_START == text.substr(idx, 2)) {
      var token = [];
      token[0] = COMMENT_TOKEN;
      token[1] = idx;
      while (idx < text.length && COMMENT_END != text.substr(idx, 2)) {
        ++idx;
      }
      if (COMMENT_END == text.substr(idx, 2)) {
        idx += 2;
      }
      token[2] = idx - token[1];
      tokens.push(token);
      continue;
    }
    if (DIGIT.test(text[idx])) {
      var token = [];
      token[0] = NUMBER_TOKEN;
      token[1] = idx;
      var num_dots = 0;
      while (idx < text.length && DIGIT_OR_DOT.test(text[idx])) {
        if (text[idx] == ".") {
          ++num_dots;
          if (num_dots >= 2) {
            var token = [];
            token[1] = idx;
            ParseError("Unexpected second dot in number.", token, model);
          }
        }
        ++idx;
      }
      token[2] = idx - token[1];
      tokens.push(token);
      continue;
    }
    if (STRING_DELIM == text[idx]) {
      var token = [];
      token[0] = STRING_TOKEN;
      token[1] = idx;
      ++idx;
      while (idx < text.length && STRING_DELIM != text[idx]) {
        ++idx;
      }
      if (STRING_DELIM == text[idx]) {
        ++idx;
      }
      token[2] = idx - token[1];
      tokens.push(token);
      continue;
    }
    {
      // All other tokens
      var token = [];
      token[0] = text[idx];
      token[1] = idx;
      token[2] = 1;
      tokens.push(token);
      ++idx;
    }
  }
  model.tokens = tokens;
}
function CleanTokens(model) {
  // Drop whitespace and comments.
  var tokens = model.tokens;
  var clean_tokens = [];
  var idx = 0;
  while (idx < tokens.length) {
    if (tokens[idx][0] == WHITE_SPACE_TOKEN) {
      ++idx;
      continue;
    }
    if (tokens[idx][0] == COMMENT_TOKEN) {
      ++idx;
      continue;
    }
    clean_tokens.push(tokens[idx]);
    ++idx;
  }
  model.tokens = clean_tokens;
}
function TokenType(model, idx) {
  return model.tokens[idx][0];
}
function TokenString(model, idx) {
  return model.text.substr(model.tokens[idx][1],
                           model.tokens[idx][2]);
}
function TokenToNode(model) {
  var node = {};
  node.type = TokenType(model, model.token_idx);
  node.token = model.tokens[model.token_idx];
  node.parent = null;
  node.left = null;
  node.right = null;
  if (node.type == NUMBER_TOKEN) {
    node.right = Number(TokenString(model, model.token_idx));
  }
  if (node.type == STRING_TOKEN) {
    node.right = String(TokenString(model, model.token_idx));
  }
  if (node.type == IDENTIFIER_TOKEN) {
    node.right = String(TokenString(model, model.token_idx));
  }
  model.token_idx += 1;
  return node;
}
function AppendBelowRight(node, new_node) {
  new_node.parent = node;
  new_node.left = node.right;
  node.right = new_node;
  if (new_node.left != null) {
    new_node.left.parent = new_node;
  }
}
function HandleNewNode(model, curr, new_node) {
  var objects;
  var operators;
  if ([START].includes(curr.type)) {
    if ([FORM_KEYWORD, PAGE_KEYWORD, PRINT_KEYWORD,
         BUTTON_KEYWORD, INPUT_KEYWORD].includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      return new_node;
    }
  }
  if ([FORM_KEYWORD, PAGE_KEYWORD, BUTTON_KEYWORD,
       INPUT_KEYWORD].includes(curr.type)) {
    if ([IDENTIFIER_TOKEN].includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      model.expression_end = true;
      if (curr.type == FORM_KEYWORD) {
        model.current_form = String(new_node.right);
      }
      if (curr.type == PAGE_KEYWORD) {
        var prev_page = model.current_page;
        model.current_page = String(new_node.right);
        if (model.pages.hasOwnProperty(model.current_page)) {
          ParseError("There is already a page named " + model.current_page,
                     new_node.token, model);
        }
        var page_info = {};
        page_info.current_form = model.current_form;
        page_info.start_expr_idx = model.expression_list.length;
        if (model.pages.hasOwnProperty(prev_page)) {
          model.pages[prev_page].next_page = model.current_page;
          page_info.prev_page = prev_page;
        }
        model.pages[model.current_page] = page_info;
      }
      return new_node;
    }
    ParseError("Expected Identifier after " + curr.type + ".",
               model.tokens[model.first_token_idx],
               model);
  }
  if (PRINT_KEYWORD.includes(curr.type)) {
    if ([STRING_TOKEN, IDENTIFIER_TOKEN].includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      model.expression_end = true;
      return new_node;
    }
    ParseError("Expected String or identifier after print.",
               model.tokens[model.first_token_idx],
               model);
  }
  if (SEMICOLON_TOKEN == new_node.type) {
    model.expression_end = true;
    return curr;
  }
  if ([START].includes(curr.type)) {
    if ([IDENTIFIER_TOKEN].includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      return new_node;
    }
  }
  if ([IDENTIFIER_TOKEN].includes(curr.type)) {
    if (["="].includes(new_node.type)) {
      curr = curr.parent;
      if ([START].includes(curr.type)) {
        AppendBelowRight(curr, new_node);
        return new_node;
      }
    }
  }
  operators = ["+", "-", "*", "/", START, "(", "="];
  objects = [NUMBER_TOKEN, "(", STRING_TOKEN, IDENTIFIER_TOKEN];
  if (operators.includes(curr.type)) {
    if (objects.includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      return new_node;
    }
  }
  objects = [NUMBER_TOKEN, "()", IDENTIFIER_TOKEN];
  if (objects.includes(curr.type)) {
    if (["*", "/"].includes(new_node.type)) {
      var stuff_to_skip = objects.concat(["*", "/"]);
      while (stuff_to_skip.includes(curr.type)) {
        curr = curr.parent;
      }
      AppendBelowRight(curr, new_node);
      return new_node;
    }
    if (["+", "-", ")"].includes(new_node.type)) {
      var stuff_to_skip = objects.concat(["+", "-", "*", "/"]);
      while (stuff_to_skip.includes(curr.type)) {
        curr = curr.parent;
      }
      if (curr.type == "(" && new_node.type == ")") {
        curr.type = "()";
        return curr;
      }
      AppendBelowRight(curr, new_node);
      return new_node;
    }
  }
  if ("+" == new_node.type) {
    while ([STRING_TOKEN, "+"].includes(curr.type)) {
      curr = curr.parent;
    }
    AppendBelowRight(curr, new_node);
    return new_node;
  }
  ParseError("Can't add " + new_node.type + " after " + curr.type,
             new_node.token, model);
  return new_node;
}
function ValidateExpression(model, expr) {
  if (expr == undefined) {
    ParseErrorPriorToken("Unexpected empty expression.", model);
  }
  if ([FORM_KEYWORD, PAGE_KEYWORD, BUTTON_KEYWORD,
       INPUT_KEYWORD].includes(expr.type)) {
    if (expr.right != undefined && expr.right.type == IDENTIFIER_TOKEN) {
      return;
    }
    ParseErrorPriorToken("Expected identifier after " + expr.type, model);
  }
  if ([PRINT_KEYWORD].includes(expr.type)) {
    if (expr.right != undefined &&
        [STRING_TOKEN, IDENTIFIER_TOKEN].includes(expr.right.type)) {
      return;
    }
    ParseErrorPriorToken("Expected string or identifier after print.", model);
  }
  if (expr.type == NUMBER_TOKEN) {
    // TODO: should we check if expr.right is a number?
    return;
  }
  if (expr.type == STRING_TOKEN) {
    // TODO: should we check if expr.right is a string?
    return;
  }
  if (["+", "-", "*", "/", "="].includes(expr.type)) {
    if (expr.left == undefined) {
      ParseError("Unexpected missing left operand.", expr.token, model);
    }
    ValidateExpression(model, expr.left);
    if (expr.right == undefined) {
      ParseError("Unexpected missing right operand.", expr.token, model);
    }
    ValidateExpression(model, expr.right);
    return;
  }
  if (expr.type == "()") {
    ValidateExpression(model, expr.right);
    return;
  }
  if (expr.type == "(") {
    ParseError("Unmatched parentheses.", expr.token, model);
  }
  if (expr.type == IDENTIFIER_TOKEN) {
    // TODO: should we check anything here?
    return;
  }
  ParseError("Unexpected token during Parsing. ", expr.token, model);
}
function ParseExpression(model) {
  var start = {};
  start.type = START;
  var curr = start;
  model.expression_end = false;
  while (model.token_idx < model.tokens.length &&
         !model.expression_end) {
    var new_node = TokenToNode(model);
    curr = HandleNewNode(model, curr, new_node);
  }
  var expr = start.right;
  ValidateExpression(model, expr);
  return expr;
}
function ExpressionDebugString(model, expr) {
  if (expr.type == NUMBER_TOKEN) {
    return String(expr.right);
  }
  if (expr.type == STRING_TOKEN) {
    return String(expr.right);
  }
  if (expr.type == IDENTIFIER_TOKEN) {
    return String(expr.right);
  }
  if (expr.type == "()") {
    return ExpressionDebugString(model, expr.right);
  }
  if (expr.type == "+") {
    return ExpressionDebugString(model, expr.left) + " " +
           ExpressionDebugString(model, expr.right) + " +";
  }
  if (expr.type == "-") {
    return ExpressionDebugString(model, expr.left) + " " +
           ExpressionDebugString(model, expr.right) + " -";
  }
  if (expr.type == "*") {
    return ExpressionDebugString(model, expr.left) + " " +
           ExpressionDebugString(model, expr.right) + " *";
  }
  if (expr.type == "/") {
    return ExpressionDebugString(model, expr.left) + " " +
           ExpressionDebugString(model, expr.right) + " /";
  }
  if (expr.type == "=") {
    return ExpressionDebugString(model, expr.left) + " " +
           ExpressionDebugString(model, expr.right) + " =";
  }
  return "Unexpected expression type: " + expr.type;
}
function RemoveQuotes(str) {
  var idx = 0;
  while (idx < str.length && str[idx] != "\"") {
    idx++;
  }
  if (str.length < 2 * (idx + 1)) {
    return "";
  }
  return str.substr(idx + 1, str.length - 2*(idx + 1));
}
// TODO: Maybe a model should also be an expression.
//       We could abstract away the difference.
// TODO: Optimize away the "()" nodes from the AST.
function Evaluate(model, expr) {
  if (expr.type == NUMBER_TOKEN) {
    return Number(expr.right);
  }
  if (expr.type == STRING_TOKEN) {
    return RemoveQuotes(String(expr.right));
  }
  if (expr.type == "+") {
    return Evaluate(model, expr.left) + Evaluate(model, expr.right);
  }
  if (expr.type == "-") {
    return Evaluate(model, expr.left) - Evaluate(model, expr.right);
  }
  if (expr.type == "*") {
    return Evaluate(model, expr.left) * Evaluate(model, expr.right);
  }
  if (expr.type == "/") {
    return Evaluate(model, expr.left) / Evaluate(model, expr.right);
  }
  if (expr.type == "()") {
    return Evaluate(model, expr.right);
  }
  if (expr.type == IDENTIFIER_TOKEN) {
    // TODO: Get the data from a form.
    return model.data[expr.right];
  }
  if (expr.type == "=") {
    value = Evaluate(model, expr.right);
    // TODO: Put the data into the current form instead of the top level model.
    model.data[expr.left.right] = value;
    return value;
  }
  ParseError("Unexpected token during Evaluation.", expr.token, model);
}
function RenderExpression(model, expr) {
  if (expr.type == FORM_KEYWORD) {
    if (expr.hasOwnProperty("right") && expr.right.type == IDENTIFIER_TOKEN) {
      model.current_form = expr.right.right;
      return "";
    }
  }
  if (expr.type == PRINT_KEYWORD) {
    return "<p>" + Evaluate(model, expr.right) + "</p>";
  }
  if (expr.type == BUTTON_KEYWORD) {
    var destination_page = String(expr.right.right);
    var str = "<button type='button' onclick='model.GoToPage(\"" +
              destination_page + "\")'>" + destination_page + "</button>";
    return str;
  }
  if (expr.type == INPUT_KEYWORD) {
    if (!model.Read) {
      model.Read = function(elem) {
        if (elem.value == Number(elem.value)) {
          model.data[elem.name] = Number(elem.value);
        } else {
          model.data[elem.name] = elem.value;
        }
      }
    }
    var identifier_name = expr.right.right;
    var id = RandomIdentifier(identifier_name);
    var str = "<input type=\"text\" name=\"" + identifier_name + 
        "\" size=\"20\" id=" + id + " onblur=\"model.Read(this);\">";
    // TODO: Need to verify:
    // The same identifier should not input more than once on a page.
    if (model.data.hasOwnProperty(identifier_name)) {
      if (!model.InitializerList) {
        model.InitializerList = [];
      }
      var current_value = Evaluate(model, expr.right);
      model.InitializerList.push({id:id, value:current_value});
    }
    return str;
  }
  Evaluate(model, expr);
  return "";
}
function RandomIdentifier(prefix) {
  return prefix + String(Math.random()).substr(2);
}
function RenderModel(model, html_form) {
  window.model = model;
  // Run the common code at the top on every page.
  var idx = 0;
  var str = "";
  while (idx < model.expression_list.length) {
    var expr = model.expression_list[idx].expression;
    if ([PAGE_KEYWORD].includes(expr.type)) {
      break;
    }
    str += RenderExpression(model, expr);
    ++idx;
  }
  // Now run the page specific code.
  var page_info = model.pages[model.current_page];
  if (page_info !== undefined) {
    model.current_form = page_info.current_form;
  } else {
    page_info = {};
    page_info.current_form = model.current_form;
    page_info.start_expr_idx = 0;
  }
  // +1 to skip past the page expression itself.
  var idx = page_info.start_expr_idx + 1;
  while (idx < model.expression_list.length) {
    var expr = model.expression_list[idx].expression;
    if ([PAGE_KEYWORD].includes(expr.type)) {
      break;
    }
    str += RenderExpression(model, expr);
    ++idx;
  }
  // GoToPage is used by the button keyword.
  model.GoToPage = function(page) {
    if (!model.pages.hasOwnProperty(page)) {
      ParseErrorPriorToken("No such page found: " + page +
                           ". Check capitalization?", model); 
    }
    model.current_page = page;
    RenderModel(model, html_form);
  }
  // Render the navigation buttons.
  str += "<p>";
  if (page_info.hasOwnProperty("prev_page")) {
    var prev_page = page_info.prev_page;
    model.RenderPrevPage = function() {
      model.current_page = prev_page;
      gtag('event', 'select_item', {
        items: [{
          item_name: 'PrevPage',
        }],
      });
      RenderModel(model, html_form);
    }
    str += "<button type='button' onclick='model.RenderPrevPage();'>Prev</button>";
  } else {
    delete model.RenderPrevPage;
    str += "<button type='button' disabled>Prev</button>";
  }
  if (page_info.hasOwnProperty("next_page")) {
    var next_page = page_info.next_page;
    model.RenderNextPage = function() {
      model.current_page = next_page;
      gtag('event', 'select_item', {
        items: [{
          item_name: 'NextPage',
        }],
      });
      RenderModel(model, html_form);
    }
    str += "<button type='button' onclick='model.RenderNextPage();'>Next</button>";
  } else {
    delete model.RenderNextPage;
    str += "<button type='button' disabled>Next</button>";
  }
  // Render the Developer Mode button
  model.DeveloperMode = function() {
    var dev_mode_textbox = RandomIdentifier("model_def_");
    model.dev_mode_textbox = dev_mode_textbox;
    gtag('event', 'select_item', {
      items: [{
        item_name: 'DeveloperMode',
      }],
    });
    model.Reload = function(model) {
      if (model.js_str_element != null) {
        var pre = document.getElementById(model.js_str_element);
        pre.remove();
      }
      gtag('event', 'select_item', {
        items: [{
          item_name: 'Reload',
        }],
      });
      var text=document.getElementById(dev_mode_textbox).value;
      var model = Parse(text);
      RenderModel(model, html_form);
    }
    model.ToJavaScript = function() {
      gtag('event', 'select_item', {
        items: [{
          item_name: 'ToJs',
        }],
      });
      var text=document.getElementById(dev_mode_textbox).value;
      var jsStr = "  var str = ";
      var lines = text.split("\n");
      var n = lines.length;
      while (lines[n-1] == "") {
        --n;
      }
      var i = 0;
      var indent = "";
      while (i < n) {
        var line = lines[i];
        line = line.split("\"").join("\\\"");
        if (i != 0) {
          jsStr += " +\n";
        }
        jsStr += indent + "\"" + line + "\\n\"";
        indent = "    ";
        i++;
      }
      jsStr += ";\n";
      navigator.clipboard.writeText(jsStr).then(
        function() {
          alert("Copied to clipboard.");
        }, function() {
          alert("Failed to copy to clipboard. See below for text.");
        });
      if (model.js_str_element == null) {
        model.js_str_element = RandomIdentifier("js_str_");
        var pre = document.createElement("pre");
        pre.id = model.js_str_element;
        pre.innerText = jsStr;
        document.body.appendChild(pre);
      } else {
        var pre = document.getElementById(model.js_str_element);
        pre.innerText = jsStr;
      }
    }
    var str = "<textarea id=" + dev_mode_textbox + " style='width: 400px; height: 340px'>"
    str += "</textarea><br>";
    str += "<button type='button' onclick='model.Reload(model)'>Run</button>";
    str += "<button type='button' onclick='model.ToJavaScript()'>To JS</button>";
    html_form.innerHTML = str;
    var textbox = document.getElementById(dev_mode_textbox);
    textbox.value = model.text;
    // Make sure we can manually click run
  }
  str += "<button type='button' onclick='model.DeveloperMode();'>Developer</button>";
  str += "</p>";
  html_form.innerHTML = str;
  str += "<p>Form: " + page_info.current_form + " Page: " + model.current_page + "</p>"
  html_form.innerHTML = str;
  while (true) {
    if (!model.InitializerList || model.InitializerList.length == 0) {
      break;
    }
    var initializer = model.InitializerList.pop();
    var elem = document.getElementById(initializer.id);
    elem.value = initializer.value;
  }
}
function RunModel(model) {
  for (var i = 0; i < model.expression_list.length; ++i) {
    Evaluate(model, model.expression_list[i].expression);
  }
}
function GetEmptyModel(text) {
  // TODO: Should model be organized with sub-objects? (parse_info, runtime_status, data)
  var model = {};
  model.text = text;
  model.token_idx = 0;
  model.data = {};
  model.expression_list = [];
  model.current_form = "";
  model.pages = {};
  model.current_page = "";
  return model;
}
function FindFirstPage(model) {
  if (model.hasOwnProperty("current_page") &&
      model.pages.hasOwnProperty(model.current_page)) {
    while(model.pages[model.current_page].hasOwnProperty("prev_page")) {
      model.current_page = model.pages[model.current_page].prev_page;
    }
  }
}
function Parse(text) {
  var model = GetEmptyModel(text);
  Tokenize(model);
  CleanTokens(model);
  while (model.token_idx < model.tokens.length) {
    model.first_token_idx = model.token_idx;
    var expr = ParseExpression(model);
    var last_token_idx = model.token_idx - 1;
    model.expression_list.push(
        {
          first_token_idx: model.first_token_idx,
          last_token_idx: last_token_idx,
          expression: expr
        });
  }
  // TODO: Make sure all button destination pages exist.
  FindFirstPage(model);
  return model;
}


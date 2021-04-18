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
// A top level object for this library.
// TODO: Move all symbols under this object.
var interview = {};
interview.InitForms = function(model) {
  // model.form_info[form_name] =
  //     {num_copies, first_id, curr_id, next_free_id}
  model.form_info = {};
  // model.form_copy_info[form_name][copy_id] =
  //     {prev_id, next_id, data}
  model.form_copy_info = {};
  // I don't want to use the empty string for the default form
  // because that's not an identifier. So the programmer would never
  // be able to get back to the default form.
  interview.SetForm(model, "scratch");
}
// Set the current form.
interview.SetForm = function(model, form_name) {
  if (!model.form_info.hasOwnProperty(form_name)) {
    var new_form_info = {};
    new_form_info.num_copies = 1;
    new_form_info.first_id = 0;
    new_form_info.curr_id = 0;
    new_form_info.next_free_id = 1;
    model.form_info[form_name] = new_form_info;

    var new_copy_info = {};
    new_copy_info.prev_id = -1;
    new_copy_info.next_id = -1;
    new_copy_info.data = {};
    model.form_copy_info[form_name] = {};
    model.form_copy_info[form_name][0] = new_copy_info;
  }
  model.curr_form = form_name;
  // Keeping model.data because otherwise there would
  // be too many broken unit tests to fix.
  model.data = interview.GetDataObj(model);
}
interview.GetDataObj = function(model) {
  var form_name = model.curr_form;
  var form_id = model.form_info[form_name].curr_id;
  return model.form_copy_info[form_name][form_id].data;
}
interview.GetFormCopyId = function(model) {
  return model.form_info[model.curr_form].curr_id;
}
interview.GetNextCopyId = function(model) {
  var form_name = model.curr_form;
  var form_id = model.form_info[form_name].curr_id;
  return model.form_copy_info[form_name][form_id].next_id;
}
interview.GetPrevCopyId = function(model) {
  var form_name = model.curr_form;
  var form_id = model.form_info[form_name].curr_id;
  return model.form_copy_info[form_name][form_id].prev_id;
}
interview.GetNumFormCopies = function(model) {
  return model.form_info[model.curr_form].num_copies;
}
interview.AppendNewFormCopy = function(model) {
  var form_name = model.curr_form;
  var form_info = model.form_info[form_name];
  var prev_copy_id = form_info.curr_id;
  var prev_copy_info = model.form_copy_info[form_name][prev_copy_id];
  var new_copy_id = form_info.next_free_id;
  form_info.next_free_id += 1;
  form_info.num_copies += 1;
  form_info.curr_id = new_copy_id;

  var new_copy_info = {};
  model.form_copy_info[form_name][new_copy_id] = new_copy_info;
  new_copy_info.prev_id = prev_copy_id;
  new_copy_info.next_id = prev_copy_info.next_id;
  new_copy_info.data = {};
  prev_copy_info.next_id = new_copy_id;
  model.data = interview.GetDataObj(model);
}
interview.DeleteFormCopy = function(model) {
  var form_name = model.curr_form;
  var form_info = model.form_info[form_name];
  if (form_info.num_copies == 1) {
    // TODO: Should we allow the last form copy to be deleted?
    // TODO: Should we throw an error if the user tries?
    return;
  }
  var old_copy_id = form_info.curr_id;
  var old_copy_info = model.form_copy_info[form_name][old_copy_id];
  form_info.curr_id = old_copy_info.next_id
  if (form_info.curr_id == -1) {
    form_info.curr_id = old_copy_info.prev_id
  }
  if (form_info.first_id == old_copy_id) {
    form_info.first_id = form_info.curr_id;
  }
  form_info.num_copies -= 1;
  if (old_copy_info.prev_id >= 0) {
    model.form_copy_info[form_name][old_copy_info.prev_id].next_id =
        old_copy_info.next_id;
  }
  if (old_copy_info.next_id >= 0) {
    model.form_copy_info[form_name][old_copy_info.next_id].prev_id =
        old_copy_info.prev_id;
  }
  delete model.form_info[form_name][old_copy_id];
  model.data = interview.GetDataObj(model);
}
interview.UseCopyId = function(model, new_id) {
  var form_name = model.curr_form;
  var form_info = model.form_info[form_name];
  form_info.curr_id = new_id;
  model.data = interview.GetDataObj(model);
}
interview.ResetCopyId = function(model, expr, new_id) {
  var form_name = model.curr_form;
  var form_info = model.form_info[form_name];
  var old_id = form_info.curr_id;
  if (old_id == new_id) {
    return;
  }
  if (model.form_copy_info.hasOwnProperty(new_id)) {
    interview.ParseError("There is already another form copy with id " + new_id + ".",
        expr.token, model);
  }
  model.form_copy_info[form_name][new_id] = model.form_copy_info[form_name][old_id];
  delete model.form_info[form_name][old_id];
  form_info.curr_id = new_id;
  if (form_info.first_id == old_id) {
    form_info.first_id = new_id;
  }
  if (form_info.next_free_id <= new_id) {
    form_info.next_free_id = new_id + 1;
  }
  // hook up the new copy in the right order
  var prev_id = interview.GetPrevCopyId(model);
  if (prev_id >= 0) {
    model.form_copy_info[form_name][prev_id].next_id = new_id;
  }
  var next_id = interview.GetNextCopyId(model);
  if (next_id >= 0) {
    model.form_copy_info[form_name][next_id].prev_id = new_id;
  }
}
interview.IncrementFormCopy = function(model, amount) {
  var form_name = model.curr_form;
  var form_id = model.form_info[form_name].curr_id;
  while(amount > 0) {
    amount -= 1;
    var next_id = model.form_copy_info[form_name][form_id].next_id;
    if (next_id >= 0) {
      form_id = next_id;
    }
  }
  while(amount < 0) {
    amount += 1;
    var prev_id = model.form_copy_info[form_name][form_id].prev_id;
    if (prev_id >= 0) {
      form_id = prev_id;
    }
  }
  interview.UseCopyId(model, form_id);
}
interview.ParseError = function(msg, token, model) {
  var idx = token[1];
  var text = model.text;
  throw "ERROR: " + msg +
        "\nidx = " + idx +
        "\n" + text.substr(0, idx + 1) + "/* Here */" +
        text.substr(idx + 1);
}
interview.ParseErrorPriorToken = function(msg, model) {
  var idx = model.token_idx - 1;
  if (idx < 0 || idx >= model.tokens.length) {
    idx = 0;
  }
  if (idx < model.tokens.length) {
    interview.ParseError(msg, model.tokens[idx], model);
  } else {
    interview.ParseError(msg, [0,0,0], model);
  }
}

interview.unique = {};
interview.CheckUnique = function(item) {
  if (interview.unique.hasOwnProperty(item)) {
    throw "ERROR: duplicate internal term: [" + item + "]";
  }
  interview.unique[item] = 1;
  return item;
}

interview.KEYWORDS = [];
interview.CheckUniqueKeyword = function(kwd) {
  interview.CheckUnique(kwd);
  interview.KEYWORDS.push(kwd);
  return kwd;
}

interview.PAGE_KEYWORD = interview.CheckUniqueKeyword("page");
interview.PRINT_KEYWORD = interview.CheckUniqueKeyword("print");
interview.BUTTON_KEYWORD = interview.CheckUniqueKeyword("button");
interview.INPUT_KEYWORD = interview.CheckUniqueKeyword("input");
interview.GOTO_KEYWORD = interview.CheckUniqueKeyword("goto");
interview.FORM_KEYWORD = interview.CheckUniqueKeyword("form");
interview.NEWCOPY_KEYWORD = interview.CheckUniqueKeyword("newcopy");
interview.NEXTCOPY_KEYWORD = interview.CheckUniqueKeyword("nextcopy");
interview.PREVCOPY_KEYWORD = interview.CheckUniqueKeyword("prevcopy");
interview.USECOPY_KEYWORD = interview.CheckUniqueKeyword("usecopy");
// This is an internal keyword for restoring state.
interview.SETCOPYID_KEYWORD = interview.CheckUniqueKeyword("internal_resetcopyid");

interview.WHITE_SPACE_TOKEN = interview.CheckUnique("ws");
interview.IDENTIFIER_TOKEN = interview.CheckUnique("id");
interview.COMMENT_TOKEN = interview.CheckUnique("cmt");
interview.STRING_TOKEN = interview.CheckUnique("str");
interview.NUMBER_TOKEN = interview.CheckUnique("num");
interview.SEMICOLON_TOKEN = interview.CheckUnique(";");
// Other types of tokens have exactly 1 character

interview.START = interview.CheckUnique("_start");

interview.Tokenize = function(model) {
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
      token[0] = interview.WHITE_SPACE_TOKEN;
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
      token[0] = interview.IDENTIFIER_TOKEN;
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
        token[0] = interview.STRING_TOKEN;
        // skip past the quote
        ++idx;
        // delim is <id>" delimiter?
        var delim_length = idx - token[1];
        var delim = text.substr(token[1], delim_length);
        // Find the next occurance of the delimiter.
        idx = text.indexOf(delim, idx);
        if (idx < 0) {
          interview.ParseError("Closing delimiter expected: [" + delim + "]",
                     token, model)
        }
        // skip past the end delimiter
        idx += delim_length;
      }
      token[2] = idx - token[1];
      var token_str = text.substr(token[1], token[2]).toLowerCase();
      if (interview.KEYWORDS.find(kwd => kwd == token_str)) {
        token[0] = token_str;
      }
      tokens.push(token);
      continue;
    }
    if (COMMENT_START == text.substr(idx, 2)) {
      var token = [];
      token[0] = interview.COMMENT_TOKEN;
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
      token[0] = interview.NUMBER_TOKEN;
      token[1] = idx;
      var num_dots = 0;
      while (idx < text.length && DIGIT_OR_DOT.test(text[idx])) {
        if (text[idx] == ".") {
          ++num_dots;
          if (num_dots >= 2) {
            var token = [];
            token[1] = idx;
            interview.ParseError("Unexpected second dot in number.", token, model);
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
      token[0] = interview.STRING_TOKEN;
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
    if (tokens[idx][0] == interview.WHITE_SPACE_TOKEN) {
      ++idx;
      continue;
    }
    if (tokens[idx][0] == interview.COMMENT_TOKEN) {
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
  if (node.type == interview.NUMBER_TOKEN) {
    node.right = Number(TokenString(model, model.token_idx));
  }
  if (node.type == interview.STRING_TOKEN) {
    node.right = String(TokenString(model, model.token_idx));
  }
  if (node.type == interview.IDENTIFIER_TOKEN) {
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
  // One word statements
  if ([interview.START].includes(curr.type)) {
    if ([interview.NEWCOPY_KEYWORD, interview.NEXTCOPY_KEYWORD, interview.PREVCOPY_KEYWORD].includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      model.expression_end = true;
      return new_node;
    }
  }
  // First word of two word statements
  if ([interview.START].includes(curr.type)) {
    if ([interview.FORM_KEYWORD, interview.PAGE_KEYWORD, interview.PRINT_KEYWORD,
         interview.BUTTON_KEYWORD, interview.INPUT_KEYWORD, interview.GOTO_KEYWORD,
         interview.SETCOPYID_KEYWORD, interview.USECOPY_KEYWORD].includes(new_node.type)) {
      if (interview.GOTO_KEYWORD == new_node.type && Object.keys(model.pages).length == 0) {
        interview.ParseError("Cannot use the goto keyword in the model header.",
                   new_node.token, model);
      }
      AppendBelowRight(curr, new_node);
      return new_node;
    }
  }
  // Second word of two word statements
  if ([interview.FORM_KEYWORD, interview.PAGE_KEYWORD, interview.BUTTON_KEYWORD,
       interview.INPUT_KEYWORD, interview.GOTO_KEYWORD].includes(curr.type)) {
    if ([interview.IDENTIFIER_TOKEN].includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      model.expression_end = true;
      if (curr.type == interview.FORM_KEYWORD) {
        interview.SetForm(model, String(new_node.right));
      }
      if (curr.type == interview.PAGE_KEYWORD) {
        var prev_page = model.current_page;
        model.current_page = String(new_node.right);
        if (model.pages.hasOwnProperty(model.current_page)) {
          interview.ParseError("There is already a page named " + model.current_page,
                     new_node.token, model);
        }
        var page_info = {};
        page_info.start_expr_idx = model.expression_list.length;
        if (model.pages.hasOwnProperty(prev_page)) {
          model.pages[prev_page].next_page = model.current_page;
          page_info.prev_page = prev_page;
        }
        model.pages[model.current_page] = page_info;
      }
      return new_node;
    }
    interview.ParseError("Expected Identifier after " + curr.type + ". Found " +
                   new_node.type + " instead.",
               model.tokens[model.first_token_idx],
               model);
  }
  if ([interview.PRINT_KEYWORD, interview.SETCOPYID_KEYWORD,
       interview.USECOPY_KEYWORD].includes(curr.type)) {
    if ([interview.STRING_TOKEN, interview.IDENTIFIER_TOKEN,
        interview.NUMBER_TOKEN].includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      model.expression_end = true;
      return new_node;
    }
    interview.ParseError("Expected String or identifier after " + curr.type,
               model.tokens[model.first_token_idx],
               model);
  }
  // Expressions
  if (interview.SEMICOLON_TOKEN == new_node.type) {
    model.expression_end = true;
    return curr;
  }
  if ([interview.START].includes(curr.type)) {
    if ([interview.IDENTIFIER_TOKEN].includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      return new_node;
    }
  }
  if ([interview.IDENTIFIER_TOKEN].includes(curr.type)) {
    if (["="].includes(new_node.type)) {
      curr = curr.parent;
      if ([interview.START].includes(curr.type)) {
        AppendBelowRight(curr, new_node);
        return new_node;
      }
    }
  }
  operators = ["+", "-", "*", "/", interview.START, "(", "="];
  objects = [interview.NUMBER_TOKEN, "(", interview.STRING_TOKEN, interview.IDENTIFIER_TOKEN];
  if (operators.includes(curr.type)) {
    if (objects.includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      return new_node;
    }
  }
  objects = [interview.NUMBER_TOKEN, "()", interview.IDENTIFIER_TOKEN];
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
    while ([interview.STRING_TOKEN, "+"].includes(curr.type)) {
      curr = curr.parent;
    }
    AppendBelowRight(curr, new_node);
    return new_node;
  }
  interview.ParseError("Can't add " + new_node.type + " after " + curr.type,
             new_node.token, model);
  return new_node;
}
function ValidateExpression(model, expr) {
  if (expr == undefined) {
    interview.ParseErrorPriorToken("Unexpected empty expression.", model);
  }
  // TODO: Should we check that left and right are empty?
  if ([interview.NEWCOPY_KEYWORD, interview.NEXTCOPY_KEYWORD, interview.PREVCOPY_KEYWORD].includes(expr.type)) {
    return;
  }
  if ([interview.FORM_KEYWORD, interview.PAGE_KEYWORD, interview.BUTTON_KEYWORD,
       interview.INPUT_KEYWORD, interview.GOTO_KEYWORD].includes(expr.type)) {
    // TODO: Should we check if page exists for button and goto keywords?
    // TODO: Should we check for dead code after goto?
    if (expr.right != undefined && expr.right.type == interview.IDENTIFIER_TOKEN) {
      return;
    }
    interview.ParseErrorPriorToken("Expected identifier after " + expr.type, model);
  }
  if ([interview.PRINT_KEYWORD, interview.SETCOPYID_KEYWORD,
       interview.USECOPY_KEYWORD].includes(expr.type)) {
    if (expr.right != undefined &&
        [interview.STRING_TOKEN, interview.IDENTIFIER_TOKEN, interview.NUMBER_TOKEN
         ].includes(expr.right.type)) {
      return;
    }
    interview.ParseErrorPriorToken("Expected string, number or identifier after " + expr.type + ".", model);
  }
  if (expr.type == interview.NUMBER_TOKEN) {
    // TODO: should we check if expr.right is a number?
    return;
  }
  if (expr.type == interview.STRING_TOKEN) {
    // TODO: should we check if expr.right is a string?
    return;
  }
  if (["+", "-", "*", "/", "="].includes(expr.type)) {
    if (expr.left == undefined) {
      interview.ParseError("Unexpected missing left operand.", expr.token, model);
    }
    ValidateExpression(model, expr.left);
    if (expr.right == undefined) {
      interview.ParseError("Unexpected missing right operand.", expr.token, model);
    }
    ValidateExpression(model, expr.right);
    return;
  }
  if (expr.type == "()") {
    ValidateExpression(model, expr.right);
    return;
  }
  if (expr.type == "(") {
    interview.ParseError("Unmatched parentheses.", expr.token, model);
  }
  if (expr.type == interview.IDENTIFIER_TOKEN) {
    // TODO: should we check anything here?
    return;
  }
  interview.ParseError("Unexpected token during Parsing. ", expr.token, model);
}
function ParseExpression(model) {
  var start = {};
  start.type = interview.START;
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
  if (expr.type == interview.NUMBER_TOKEN) {
    return String(expr.right);
  }
  if (expr.type == interview.STRING_TOKEN) {
    return String(expr.right);
  }
  if (expr.type == interview.IDENTIFIER_TOKEN) {
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
  if (expr.type == interview.NUMBER_TOKEN) {
    return Number(expr.right);
  }
  if (expr.type == interview.STRING_TOKEN) {
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
  if (expr.type == interview.IDENTIFIER_TOKEN) {
    var identifier = expr.right;
    return model.data[identifier];
  }
  if (expr.type == "=") {
    var identifier = expr.left.right;
    var value = Evaluate(model, expr.right);
    model.data[identifier] = value;
    return value;
  }
  if (expr.type == interview.FORM_KEYWORD) {
    if (expr.hasOwnProperty("right") && expr.right.type == interview.IDENTIFIER_TOKEN) {
      var form_name = expr.right.right;
      interview.SetForm(model, form_name);
      return "";
    }
  }
  if (expr.type == interview.NEWCOPY_KEYWORD) {
    interview.AppendNewFormCopy(model);
    return "";
  }
  if (expr.type == interview.NEXTCOPY_KEYWORD) {
    interview.IncrementFormCopy(model, 1);
    return "";
  }
  if (expr.type == interview.PREVCOPY_KEYWORD) {
    interview.IncrementFormCopy(model, -1);
    return "";
  }
  if (expr.type == interview.USECOPY_KEYWORD) {
    interview.UseCopyId(model, Evaluate(model, expr.right));
    return "";
  }
  if (expr.type == interview.SETCOPYID_KEYWORD) {
    interview.ResetCopyId(model, expr, Evaluate(model, expr.right));
    return "";
  }
  interview.ParseError("Unexpected token during Evaluation.", expr.token, model);
}
function RenderExpression(model, expr) {
  if (expr.type == interview.PRINT_KEYWORD) {
    return "<p>" + Evaluate(model, expr.right) + "</p>";
  }
  if (expr.type == interview.BUTTON_KEYWORD) {
    var destination_page = String(expr.right.right);
    var str = "<button type='button' onclick='model.GoToPage(\"" +
              destination_page + "\")'>" + destination_page + "</button>";
    return str;
  }
  if (expr.type == interview.INPUT_KEYWORD) {
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
    var id = interview.RandomIdentifier(identifier_name);
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
interview.RandomIdentifier = function(prefix) {
  return prefix + String(Math.random()).substr(2);
}
interview.Reload = function(model) {
  gtag('event', 'screen_view', {
    'screen_name' : 'Reload'
  });
  // Should only be used to restart the model from developer mode.
  if (model.dev_mode_textbox == null) {
    return;
  }
  if (model.js_str_element != null) {
    var pre = document.getElementById(model.js_str_element);
    pre.remove();
  }
  var text=document.getElementById(model.dev_mode_textbox).value;
  var html_form = model.html_form;
  var model = Parse(text);
  RenderModel(model, html_form);
  return model;
}
interview.ZeroPrefix = function(num, digits) {
  if (digits == null) {
    digits = 2;
  }
  num = "" + num;
  while (num.length < digits) {
    num = "0" + num;
  }
  return num;
}
interview.GetSavePageName = function(datetime) {
  return [
      "Restore_from",
       "" + datetime.getFullYear(),
       interview.ZeroPrefix(1 + datetime.getMonth()),
       interview.ZeroPrefix(datetime.getDate()),
       "at",
       interview.ZeroPrefix(datetime.getHours()),
       interview.ZeroPrefix(datetime.getMinutes()),
       interview.ZeroPrefix(datetime.getSeconds())
     ].join("_");
}
interview.GetTextIndexOfPage = function(model, page_name) {
  if (!model.pages.hasOwnProperty(page_name)) {
    return model.text.length;
  }
  var page_info = model.pages[page_name];
  var start_expr_idx = page_info.start_expr_idx;
  var start_expr_info = model.expression_list[start_expr_idx];
  var first_token_idx = start_expr_info.first_token_idx;
  var first_token = model.tokens[first_token_idx];
  return first_token[1];
}
interview.DataToFormula = function(model) {
  var results = [];
  for(var var_name in model.data) {
    var quote = "";
    if (model.data[var_name] != Number(model.data[var_name])) {
      var quote = "\"";
      var i = 0;
      while (model.data[var_name].includes(quote)) {
        quote = "z" + i + "\"";
        i += 1;
      }
    }
    results.push("  " + var_name + " = " + quote + model.data[var_name] + quote + ";\n");
  }
  return results.join("");
}
interview.SaveState = function(model) {
  gtag('event', 'screen_view', {
    'screen_name' : 'SaveState'
  });
  var new_code_textbox = document.getElementById(model.dev_mode_textbox);
  var proceed = false;
  if (model.text == new_code_textbox.value) {
    proceed = true
  }
  var last_known_page = model.current_page;
  var last_known_form = model.curr_form;
  var last_know_form_copy = interview.GetFormCopyId(model);
  var original_first_page = interview.FindFirstPage(model);
  // TODO: Check if original first page is already an older restore page?
  var save_page_name = interview.GetSavePageName(model.dev_mode_start_time);
  var save_page = "page " + save_page_name + "\n";
  for (var form_name in model.form_info) {
    save_page += "  form " + form_name + "\n";
    interview.SetForm(model, form_name);
    var copy_id = model.form_info[form_name].first_id;
    while(copy_id >= 0) {
      save_page += "  internal_resetcopyid " + copy_id + "\n";
      interview.UseCopyId(model, copy_id);
      save_page += interview.DataToFormula(model);
      copy_id = model.form_copy_info[form_name][copy_id].next_id;
    }
  }
  save_page += "  form " + last_known_form + " /* last_known_form */\n";
  save_page += "  usecopy " + last_know_form_copy + " /* last_known_copy_id */\n";
  save_page += "  goto " + last_known_page + " /* last_known_page */\n";
  var char_idx = interview.GetTextIndexOfPage(model, original_first_page);
  var prefix = model.text.substr(0, char_idx);
  var suffix = model.text.substr(char_idx);
  var new_model_text = prefix + save_page + suffix;
  if (new_code_textbox.value == new_model_text) {
    proceed = true
  }
  if (!proceed) {
    proceed = confirm("Model is modified! Your changes will be lost.");
  }
  if (!proceed) {
    return;
  }
  new_code_textbox.value = new_model_text;
}
interview.ToJavaScript = function(model) {
  gtag('event', 'screen_view', {
    'screen_name' : 'ToJs'
  });
  // Should only be used to get Javascript from the model in developer mode.
  if (model.dev_mode_textbox == null) {
    return;
  }
  var text=document.getElementById(model.dev_mode_textbox).value;
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
    model.js_str_element = interview.RandomIdentifier("js_str_");
    var pre = document.createElement("pre");
    pre.id = model.js_str_element;
    pre.innerText = jsStr;
    document.body.appendChild(pre);
  } else {
    var pre = document.getElementById(model.js_str_element);
    pre.innerText = jsStr;
  }
}
interview.DeveloperMode = function(model) {
  gtag('event', 'screen_view', {
     'screen_name' : 'DeveloperMode'
  });
  var dev_mode_textbox = interview.RandomIdentifier("model_def_");
  model.dev_mode_textbox = dev_mode_textbox;
  // This is needed here to make it easy for SaveState to tell if the model is modified.
  model.dev_mode_start_time = new Date();
  var str = "<textarea id=" + dev_mode_textbox + " style='width: 475px; height: 360px'>"
  str += "</textarea><br>";
  str += "<button type='button' onclick='interview.Reload(model)'>Run</button>";
  str += "<button type='button' onclick='interview.SaveState(model)'>Save State</button>";
  str += "<button type='button' onclick='interview.ToJavaScript(model)'>To JS</button>";
  model.html_form.innerHTML = str;
  var textbox = document.getElementById(dev_mode_textbox);
  textbox.value = model.text;
}
function RenderModel(model, html_form) {
  window.model = model;
  model.html_form = html_form;
  gtag('event', 'screen_view', {
    'screen_name' : model.current_page
  });
  // Run the common code at the top on every page.
  var idx = 0;
  var str = "";
  while (idx < model.expression_list.length) {
    var expr = model.expression_list[idx].expression;
    if ([interview.PAGE_KEYWORD].includes(expr.type)) {
      break;
    }
    str += RenderExpression(model, expr);
    ++idx;
  }
  // Now run the page specific code.
  var page_info = model.pages[model.current_page];
  if (page_info == undefined) {
    // TODO: Is there any point in having a model without any pages?
    page_info = {};
    page_info.start_expr_idx = 0;
  }
  // +1 to skip past the page expression itself.
  var idx = page_info.start_expr_idx + 1;
  while (idx < model.expression_list.length) {
    var expr = model.expression_list[idx].expression;
    if ([interview.PAGE_KEYWORD].includes(expr.type)) {
      break;
    }
    // TODO: Should we detect and prevent infinite loops?
    if (expr.type == interview.GOTO_KEYWORD) {
      model.current_page = expr.right.right;
      if (!model.pages.hasOwnProperty(model.current_page)) {
        interview.ParseErrorPriorToken("No such page found: " + model.current_page +
                             ". Check capitalization?", model); 
      }
      page_info = model.pages[model.current_page];
      // +1 to skip past the page expression itself.
      idx = page_info.start_expr_idx + 1;
      continue;
    }
    str += RenderExpression(model, expr);
    ++idx;
  }
  // GoToPage is used by the button keyword.
  model.GoToPage = function(page) {
    if (!model.pages.hasOwnProperty(page)) {
      interview.ParseErrorPriorToken("No such page found: " + page +
                           ". Check capitalization?", model); 
    }
    model.current_page = page;
    RenderModel(model, model.html_form);
  }
  // Render the navigation buttons.
  str += "<p>";
  if (page_info.hasOwnProperty("prev_page")) {
    var prev_page = page_info.prev_page;
    model.RenderPrevPage = function() {
      model.current_page = prev_page;
      RenderModel(model, model.html_form);
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
      RenderModel(model, model.html_form);
    }
    str += "<button type='button' onclick='model.RenderNextPage();'>Next</button>";
  } else {
    delete model.RenderNextPage;
    str += "<button type='button' disabled>Next</button>";
  }
  str += "<button type='button' onclick='interview.DeveloperMode(model);'>Developer</button>";
  str += "</p>";
  var form_idx = "[" + interview.GetFormCopyId(model) + "]";
  str += "<p>Form: " + model.curr_form + form_idx + " Page: " + model.current_page + "</p>"
  model.html_form.innerHTML = str;
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
  model.pages = {};
  model.current_page = "";
  interview.InitForms(model);
  return model;
}
interview.FindFirstPage = function(model) {
  if (!model.hasOwnProperty("current_page") ||
      !model.pages.hasOwnProperty(model.current_page)) {
    return "";
  }
  var page = model.current_page;
  while(model.pages[page].hasOwnProperty("prev_page")) {
    page = model.pages[page].prev_page;
  }
  return page;
}
function Parse(text) {
  var model = GetEmptyModel(text);
  interview.Tokenize(model);
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
  model.current_page = interview.FindFirstPage(model);
  return model;
}


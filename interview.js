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
var MESSAGE_KEYWORD = CheckUniqueKeyword("message");
var CHOICES_KEYWORD = CheckUniqueKeyword("choices");
var NEXT_KEYWORD = CheckUniqueKeyword("next");

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
    if ([FORM_KEYWORD, PAGE_KEYWORD].includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      if (model.token_idx < model.tokens.length) {
        curr = new_node;
        new_node = TokenToNode(model);
      }
      if ([IDENTIFIER_TOKEN].includes(new_node.type)) {
        AppendBelowRight(curr, new_node);
        model.expression_end = true;
        // TODO: Delete this hack.
        // We have to rewind so the caller can detect we are at the end of the expression.
        //model.token_idx -= 1;
        return new_node;
      }
      ParseError("Expected Identfier after " + new_node.type + ".",
                 model.tokens[model.first_token_idx],
                 model);
    }
    if (MESSAGE_KEYWORD.includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      if (model.token_idx < model.tokens.length) {
        curr = new_node;
        new_node = TokenToNode(model);
      }
      if ([STRING_TOKEN].includes(new_node.type)) {
        AppendBelowRight(curr, new_node);
        model.expression_end = true;
        // TODO: Delete this hack.
        // We have to rewind so the caller can detect we are at the end of the expression.
        //model.token_idx -= 1;
        return new_node;
      }
      ParseError("Expected String after " + new_node.type + ".",
                 model.tokens[model.first_token_idx],
                 model);
    }
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
  ParseError("Can't add " + new_node.type + " after " + curr.type,
             new_node.token, model);
  return new_node;
}
function ValidateExpression(model, expr) {
  if (expr == undefined) {
    ParseErrorPriorToken("Unexpected empty expression.", model);
  }
  if ([FORM_KEYWORD, PAGE_KEYWORD].includes(expr.type)) {
    if (expr.right.type == IDENTIFIER_TOKEN) {
      return;
    }
    ParseError("Expected identifier for " + expr.type, model.tokens[idx], model);
  }
  if ([MESSAGE_KEYWORD].includes(expr.type)) {
    if (expr.right.type == STRING_TOKEN) {
      return;
    }
    ParseError("Expected string for message.", model.tokens[idx], model);
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
// TODO: Maybe a model should also be an expression.
//       We could abstract away the difference.
// TODO: Optimize away the "()" nodes from the AST.
function Evaluate(model, expr) {
  if (expr.type == NUMBER_TOKEN) {
    return Number(expr.right);
  }
  if (expr.type == STRING_TOKEN) {
    return String(expr.right);
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
    return model.data[expr.right];
  }
  if (expr.type == "=") {
    value = Evaluate(model, expr.right);
    model.data[expr.left.right] = value;
    return value;
  }
  ParseError("Unexpected token during Evaluation.", expr.token, model);
}
// TODO: Rename: RenderModel().
// TODO: Accept a parameter with an HTML form to render the model into.
// TODO: Fix unit tests that don't render anything to use Evaluate().
function RunModel(model) {
  for (var i = 0; i < model.expression_list.length; ++i) {
    Evaluate(model, model.expression_list[i].expression);
  }
}
function GetEmptyModel(text) {
  var model = {};
  model.text = text;
  model.token_idx = 0;
  model.data = {};
  model.expression_list = [];
  return model;
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
  return model;
}


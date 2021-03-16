function ParseError(msg, token, model) {
  var idx = token[1];
  var text = model.text;
  throw "ERROR: " + msg +
        "\nidx = " + idx +
        "\n" + text.substr(0, idx + 1) + "/* Here */" +
        text.substr(idx + 1);
}

// Other types of tokens have exactly 1 character
var WHITE_SPACE_TOKEN = "ws";
var IDENTIFIER_TOKEN = "id";
var COMMENT_TOKEN = "cmt";
var DIGITS_TOKEN = "dgt"
var STRING_TOKEN = "str"
var NUMBER_TOKEN = "num"

function Tokenize(model) {
  var WHITE_SPACE = /\s/;
  var COMMENT_START = "/*";
  var COMMENT_END = "*/";
  var STRING_DELIM = "\"";
  var STRING_ESCAPE = "\\";
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
      token[2] = idx - token[1];
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
      // TODO: Handle STRING_ESCAPE
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
function CleanTokens(tokens, text) {
  // Drop whitespace and comments.
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
  return clean_tokens;
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
  if (["head"].includes(curr.type)) {
    if ([IDENTIFIER_TOKEN].includes(new_node.type)) {
      AppendBelowRight(curr, new_node);
      return new_node;
    }
  }
  if ([IDENTIFIER_TOKEN].includes(curr.type)) {
    if (["="].includes(new_node.type)) {
      curr = curr.parent;
      if (["head"].includes(curr.type)) {
        AppendBelowRight(curr, new_node);
        return new_node;
      }
    }
  }
  operators = ["+", "-", "*", "/", "head", "(", "="];
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
function ParseExpression(model) {
  var head = {};
  head.type = "head";
  var curr = head;
  while (model.token_idx < model.tokens.length &&
         TokenType(model, model.token_idx) != ";") {
    var new_node = TokenToNode(model);
    curr = HandleNewNode(model, curr, new_node);
  }
  if (model.token_idx < model.tokens.length) {
    model.token_idx += 1;
  } else {
    ParseError("Unterminated Statement. Expected ; semicolon.",
               model.tokens[model.first_token_idx],
               model);
  }
  return head.right;
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
// TODO: Delete this and make Evaluate handle expressions and statements.
//       expressions and statements can be the same thing.
function ParseStatement(model) {
  var idx = model.token_idx;
  var first_token_idx = idx;
  if (model.tokens[idx][0] != IDENTIFIER_TOKEN) {
    ParseError("Expected Identifier.",
               model.tokens[first_token_idx],
               model);
  }
  var name = model.text.substr(model.tokens[idx][1], model.tokens[idx][2]);
  ++idx;
  if (idx >= model.tokens.length || model.tokens[idx][0] != "=") {
    ParseError("Expected '='.",
               model.tokens[idx],
               model);
  }
  ++idx;
  model.token_idx = idx;
  var expression = ParseExpression(model);
  var last_token_idx = model.token_idx;
  if (last_token_idx >= model.tokens.length ||
      model.tokens[last_token_idx][0] != ";") {
    ParseError("Unterminated Statement.",
               model.tokens[first_token_idx],
               model);
  }
  model.statement_list.push(
      {
        first_token_idx: first_token_idx,
        last_token_idx: last_token_idx,
        name: name,
        expression: expression,
        value: Evaluate(model, expression),
      });
}
function RunModel(model) {
  for (var i = 0; i < model.expression_list.length; ++i) {
    Evaluate(model, model.expression_list[i].expression);
  }
}
function Parse(text) {
  var model = {};
  model.text = text;
  Tokenize(model);
  model.statement_list = [];
  model.token_idx = 0;
  model.data = {};
  // TODO: Don't pass out the tokens from Tokenize. Instead pass in a model.
  // Then update errors in the model.
  model.tokens = CleanTokens(model.tokens, text);
  model.expression_list = [];
  while (model.token_idx < model.tokens.length) {
    // ParseStatement(model);
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


function FAIL(msg) {
  console.trace("ERROR: " + msg);
}
function EXPECT_EQ(a, b) {
  if (a==b) return;
  console.trace("ERROR: Not Equal: [", a, "] = [", b, "]");
}
function EXPECT_INCLUDES(list, value) {
  if (list.includes(value)) return;
  console.trace("ERROR: Does not include [", value, "]: [", list, "]");
}
function EXPECT_SUBSTR(haystack, needle) {
  if (haystack.includes(needle)) return;
  console.trace("ERROR: Does contain substring [", needle, "]: [", haystack, "]");
}
function EXPECT_NOT_SUBSTR(haystack, needle) {
  if (haystack.includes(needle)) {
    console.trace("ERROR: Contains unexpected substring [", needle, "]: [", haystack, "]");
  }
}

function TokenizeForTest(str) {
  var model = {};
  model.text = str;
  interview.Tokenize(model);
  return model.tokens;
}
function TestTokenizeNumbers() {
  var model = {};
  model.text = "1020339";
  interview.Tokenize(model);
  var tokens = model.tokens;
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.NUMBER_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 7);

  model = {};
  model.text = "1020.339";
  interview.Tokenize(model);
  tokens = model.tokens;
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.NUMBER_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 8);

  try {
    model = {};
    model.text = "1020.33.9";
    interview.Tokenize(model);
    tokens = model.tokens;
    FAIL("Should throw an error because of extra  dot");
  } catch(err) {
    EXPECT_EQ(
        err,
        "ERROR: Unexpected second dot in number.\nidx = 7\n" +
        "1020.33./* Here */9");
  }

  model = {};
  model.text = "1020.33a";
  interview.Tokenize(model);
  tokens = model.tokens;
  EXPECT_EQ(tokens.length, 2);
  EXPECT_EQ(tokens[0][0], interview.NUMBER_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 7);
  EXPECT_EQ(tokens[1][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[1][1], 7);
  EXPECT_EQ(tokens[1][2], 1);

  tokens = TokenizeForTest("a990.33");
  EXPECT_EQ(tokens.length, 3);
  EXPECT_EQ(tokens[0][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 4);
  EXPECT_EQ(tokens[1][0], ".");
  EXPECT_EQ(tokens[1][1], 4);
  EXPECT_EQ(tokens[1][2], 1);
  EXPECT_EQ(tokens[2][0], interview.NUMBER_TOKEN);
  EXPECT_EQ(tokens[2][1], 5);
  EXPECT_EQ(tokens[2][2], 2);
}
function TestTokenizeOneToken() {
  var tokens = TokenizeForTest(" \n\r\t ");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 5);

  tokens = TokenizeForTest("aabb09A_sdf");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 11);

  tokens = TokenizeForTest("/* Hello world 123 \" *&^  /* haha */");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.COMMENT_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 36);
  EXPECT_EQ("/* Hello world 123 \" *&^  /* haha */".length, 36);

  var s = "\"Hello world /* blah blah */ 23123\"";
  tokens = TokenizeForTest(s);
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.STRING_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 35);
  EXPECT_EQ(s.length, 35);
}
function TestTokenizeManyTokens() {
  var tokens = TokenizeForTest(" xXx =   yY09;\n alert();");
  EXPECT_EQ(tokens.length, 12);
  var token_num = 0;
  EXPECT_EQ(tokens[token_num][0], interview.WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 1);
  EXPECT_EQ(tokens[token_num][2], 3);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 4);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], "=");
  EXPECT_EQ(tokens[token_num][1], 5);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 6);
  EXPECT_EQ(tokens[token_num][2], 3);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 9);
  EXPECT_EQ(tokens[token_num][2], 4);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], ";");
  EXPECT_EQ(tokens[token_num][1], 13);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 14);
  EXPECT_EQ(tokens[token_num][2], 2);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 16);
  EXPECT_EQ(tokens[token_num][2], 5);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], "(");
  EXPECT_EQ(tokens[token_num][1], 21);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], ")");
  EXPECT_EQ(tokens[token_num][1], 22);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], ";");
  EXPECT_EQ(tokens[token_num][1], 23);
  EXPECT_EQ(tokens[token_num][2], 1);
  
  tokens = TokenizeForTest("a = \"hello world/* sdf */\"; /* ha! \"ha!\" */");
  EXPECT_EQ(tokens.length, 8);
  var token_num = 0;
  EXPECT_EQ(tokens[token_num][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 1);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], '=');
  EXPECT_EQ(tokens[token_num][1], 2);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 3);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.STRING_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 4);
  EXPECT_EQ(tokens[token_num][2], 22);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], ";");
  EXPECT_EQ(tokens[token_num][1], 26);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 27);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.COMMENT_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 28);
  EXPECT_EQ(tokens[token_num][2], 15);
}
function TestTokenizeBadNumbers() {
  var tokens = TokenizeForTest("xx999.0993");
  EXPECT_EQ(tokens.length, 3);
  var token_num = 0;
  EXPECT_EQ(tokens[token_num][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 5);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], ".");
  EXPECT_EQ(tokens[token_num][1], 5);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.NUMBER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 6);
  EXPECT_EQ(tokens[token_num][2], 4);

  tokens = TokenizeForTest("999xyz");
  EXPECT_EQ(tokens.length, 2);
  token_num = 0;
  EXPECT_EQ(tokens[token_num][0], interview.NUMBER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 3);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 3);
  EXPECT_EQ(tokens[token_num][2], 3);

  tokens = TokenizeForTest("999.xyz");
  EXPECT_EQ(tokens.length, 2);
  token_num = 0;
  EXPECT_EQ(tokens[token_num][0], interview.NUMBER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 4);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 4);
  EXPECT_EQ(tokens[token_num][2], 3);

  tokens = TokenizeForTest("999.345xyz");
  EXPECT_EQ(tokens.length, 2);
  token_num = 0;
  EXPECT_EQ(tokens[token_num][0], interview.NUMBER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 7);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 7);
  EXPECT_EQ(tokens[token_num][2], 3);
}
function TestCleanTokens() {
  var text = "  x /* hi */ = y 100.0 \" \" ;";
  var model = {};
  model.text = text;
  interview.Tokenize(model);
  EXPECT_EQ(model.tokens.length, 14);
  CleanTokens(model);
  var tokens = model.tokens;
  EXPECT_EQ(tokens.length, 6);
  var idx = 0;
  EXPECT_EQ(tokens[idx][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[idx][1], 2);
  EXPECT_EQ(tokens[idx][2], 1);
  ++idx;
  EXPECT_EQ(tokens[idx][0], "=");
  EXPECT_EQ(tokens[idx][1], 13);
  EXPECT_EQ(tokens[idx][2], 1);
  ++idx;
  EXPECT_EQ(tokens[idx][0], interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[idx][1], 15);
  EXPECT_EQ(tokens[idx][2], 1);
  ++idx;
  EXPECT_EQ(tokens[idx][0], interview.NUMBER_TOKEN);
  EXPECT_EQ(tokens[idx][1], 17);
  EXPECT_EQ(tokens[idx][2], 5);
  ++idx;
  EXPECT_EQ(tokens[idx][0], interview.STRING_TOKEN);
  EXPECT_EQ(tokens[idx][1], 23);
  EXPECT_EQ(tokens[idx][2], 3);
  ++idx;
  EXPECT_EQ(tokens[idx][0], ";");
  EXPECT_EQ(tokens[idx][1], 27);
  EXPECT_EQ(tokens[idx][2], 1);
}
function TestParseAndRunAssignments() {
  var model = Parse("x = \"hello world\";");
  EXPECT_EQ(model.expression_list.length, 1);
  EXPECT_EQ(model.expression_list[0].first_token_idx, 0);
  EXPECT_EQ(model.expression_list[0].last_token_idx, 3);
  var expr = model.expression_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "x \"hello world\" =");
  RunModel(model);
  EXPECT_EQ(model.data["x"], "hello world");

  model = Parse("x = 1; y = 2;");
  EXPECT_EQ(model.expression_list.length, 2);
  EXPECT_EQ(model.expression_list[0].first_token_idx, 0);
  EXPECT_EQ(model.expression_list[0].last_token_idx, 3);
  EXPECT_EQ(model.expression_list[1].first_token_idx, 4);
  EXPECT_EQ(model.expression_list[1].last_token_idx, 7);
  expr = model.expression_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "x 1 =");
  expr = model.expression_list[1].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "y 2 =");
  RunModel(model);
  EXPECT_EQ(model.data["x"], 1);
  EXPECT_EQ(model.data["y"], 2);

  // TODO: Should we require a semicolon for the last expression?
  model = Parse(" /* irrelevant */ x = \"doesn't need a ; lol\"");
  expr = model.expression_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "x \"doesn't need a ; lol\" =");

  model = Parse("x = 13;");
  expr = model.expression_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "x 13 =");
  EXPECT_EQ(expr.type, "=");
  EXPECT_EQ(expr.left.type, interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(expr.left.right, "x");
  expr = expr.right;
  EXPECT_EQ(expr.type, interview.NUMBER_TOKEN);
  EXPECT_EQ(expr.right, 13);
  EXPECT_EQ(Evaluate(model, expr), 13);
  RunModel(model);
  EXPECT_EQ(model.data["x"], 13);

  model = Parse("x = 1 + 2 + 3;");
  expr = model.expression_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "x 1 2 + 3 + =");
  EXPECT_EQ(expr.type, "=");
  expr = expr.right;
  EXPECT_EQ(expr.type, "+");
  EXPECT_EQ(expr.right.type, interview.NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 3);
  expr = expr.left;
  EXPECT_EQ(expr.type, "+");
  EXPECT_EQ(expr.right.type, interview.NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 2);
  EXPECT_EQ(expr.left.type, interview.NUMBER_TOKEN);
  EXPECT_EQ(expr.left.right, 1);
  EXPECT_EQ(model.token_idx, 8);
  RunModel(model);
  EXPECT_EQ(model.data["x"], 6);

  model = Parse("x = 10 - 2 - 4;");
  EXPECT_EQ(model.token_idx, 8);
  expr = model.expression_list[0].expression;
  EXPECT_EQ(expr.type, "=");
  expr = expr.right;
  EXPECT_EQ(ExpressionDebugString(model, expr), "10 2 - 4 -");
  EXPECT_EQ(expr.type, "-");
  EXPECT_EQ(expr.right.type, interview.NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 4);
  expr = expr.left;
  EXPECT_EQ(expr.type, "-");
  EXPECT_EQ(expr.right.type, interview.NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 2);
  EXPECT_EQ(expr.left.type, interview.NUMBER_TOKEN);
  EXPECT_EQ(expr.left.right, 10);
  RunModel(model);
  EXPECT_EQ(model.data["x"], 4);

  model = Parse("x = 2 * 4 * 9;");
  expr = model.expression_list[0].expression;
  EXPECT_EQ(expr.type, "=");
  expr = expr.right;
  EXPECT_EQ(ExpressionDebugString(model, expr), "2 4 * 9 *");
  EXPECT_EQ(Evaluate(model, expr), 72);
  RunModel(model);
  EXPECT_EQ(model.data["x"], 72);

  model = Parse("x = 64 / 4 / 2;");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(ExpressionDebugString(model, expr), "64 4 / 2 /");
  EXPECT_EQ(Evaluate(model, expr), 8);
  RunModel(model);
  EXPECT_EQ(model.data["x"], 8);

  model = Parse("x = 1 + 4 * 9 / 2 - 5;");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(ExpressionDebugString(model, expr), "1 4 9 * 2 / + 5 -");
  EXPECT_EQ(Evaluate(model, expr), 14);
  RunModel(model);
  EXPECT_EQ(model.data["x"], 14);

  model = Parse("x = (((6 - 2 -2)));");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(ExpressionDebugString(model, expr),
            "6 2 - 2 -");
  EXPECT_EQ(Evaluate(model, expr), 2);
  RunModel(model);
  EXPECT_EQ(model.data["x"], 2);

  model = Parse("x = 1 + (1 + 3) * 3 / 2 / 2;");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(ExpressionDebugString(model, expr),
            "1 1 3 + 3 * 2 / 2 / +");
  EXPECT_EQ(Evaluate(model, expr), 4);
  RunModel(model);
  EXPECT_EQ(model.data["x"], 4);

  model = Parse("x = (11 * 5 - 50);");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(ExpressionDebugString(model, expr),
            "11 5 * 50 -");
  EXPECT_EQ(Evaluate(model, expr), 5);
  RunModel(model);
  EXPECT_EQ(model.data["x"], 5);

  model = Parse("x = (6 - 2 -2) * (1 + (1 + 3) * 3 / 2 / 2) - (11 * 5 - 50);");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(ExpressionDebugString(model, expr),
            "6 2 - 2 - 1 1 3 + 3 * 2 / 2 / + * 11 5 * 50 - -");
  EXPECT_EQ(Evaluate(model, expr), 3);
  RunModel(model);
  EXPECT_EQ(model.data["x"], 3);
}
function TestParseAndRunAssignmentsWithState() {
  var model = Parse("x = 1; y = 2; x = x + y; y = y + 2; x = x * y;");
  RunModel(model);
  EXPECT_EQ(model.data["x"], 12);
  EXPECT_EQ(model.data["y"], 4);
}
function TestValidatingAssignments() {
  try {
    model = Parse("/* ; blah \" foo ; \" */; x=2;");
    FAIL("/* ; blah \" foo ; \" */; x=2; Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Unexpected empty expression.\nidx = 22\n" +
        "/* ; blah \" foo ; \" */;/* Here */ x=2;");
  }

  try {
    model = Parse("/* ; blah \" foo ; \" */x=;");
    FAIL("/* ; blah \" foo ; \" */x=; Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Unexpected missing right operand.\nidx = 23\n" +
        "/* ; blah \" foo ; \" */x=/* Here */;");
  }

  try {
    model = Parse("abc = ");
    FAIL("abc =  Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Unexpected missing right operand.\nidx = 4\n" +
        "abc =/* Here */ ");
  }

  try {
    model = Parse("abc = ( 3 + 4;");
    FAIL(" =  Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Unmatched parentheses.\nidx = 6\n" +
        "abc = (/* Here */ 3 + 4;");
  }

  model = Parse("/* Should empty expressions parse? lol */");
  EXPECT_EQ(model.expression_list.length, 0);
}
function TestValidatingFormExpressions() {
  try {
    model = Parse("Form form");
    FAIL("Form form Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Expected Identifier after form. Found form instead.\nidx = 0\n" +
        "F/* Here */orm form");
  }
  try {
    model = Parse("Form");
    FAIL("Form Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Expected identifier after form\nidx = 0\n" +
        "F/* Here */orm");
  }

  try {
    model = Parse("PAGE pAgE");
    FAIL("PAGE pAgE Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Expected Identifier after page. Found page instead.\nidx = 0\n" +
        "P/* Here */AGE pAgE");
  }

  try {
    model = Parse("PAGE");
    FAIL("PAGE Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Expected identifier after page\nidx = 0\n" +
        "P/* Here */AGE");
  }
}
function TestTokenizeIdDelimitedStrings() {
  var tokens = TokenizeForTest("\"hello\n\n\rworld\"");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.STRING_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 15);

  tokens = TokenizeForTest("abc\"hello\n\n\rworldabc\"");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.STRING_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 21);

  tokens = TokenizeForTest("abc\"hello\n\"\n\rworldabc\"");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.STRING_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 22);
  
  try {
    tokens = TokenizeForTest("abc\"hello\n\"\n\rworld\"");
    FAIL("Foo!");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Closing delimiter expected: [abc\"]\n" +
        "idx = 0\n"+
        "a/* Here */bc\"hello\n\"\n\rworld\"");
  }

  tokens = TokenizeForTest("abc\"\"\"\"\"\"abc\"");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.STRING_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 13);

  tokens = TokenizeForTest("abc\"abcabcabc'abc`abc\"");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.STRING_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 22);

  s = " zzzz\"Typical usage\n\n \"hi!\" zzzz false alarm. zzzz\" ";
  tokens = TokenizeForTest(s);
  EXPECT_EQ(tokens.length, 3);
  EXPECT_EQ(tokens[0][0], interview.WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[1][0], interview.STRING_TOKEN);
  EXPECT_EQ(tokens[2][0], interview.WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[1][1], 1);
  EXPECT_EQ(s.length, 52);
  EXPECT_EQ(tokens[1][2], 50);
}
function TestEvaluateStrings() {
  var model = Parse("x = \"hello world\";");
  RunModel(model);
  EXPECT_EQ(model.data["x"], "hello world");

  model = Parse("x = a\"hello to a world with a \"a\";");
  RunModel(model);
  EXPECT_EQ(model.data["x"], "hello to a world with a \"");

  model = Parse("x = \"\";");
  RunModel(model);
  EXPECT_EQ(model.data["x"], "");

  model = Parse("x = abc\"abc\";");
  RunModel(model);
  EXPECT_EQ(model.data["x"], "");

  model = Parse("x = abc\"abcabc\";");
  RunModel(model);
  EXPECT_EQ(model.data["x"], "abc");

  model = Parse("x = abc\"\"abc\";");
  RunModel(model);
  EXPECT_EQ(model.data["x"], "\"");
}
function TestStringAddition() {
  var model = Parse("x = \"hello \" + \"world\";");
  RunModel(model);
  EXPECT_EQ(model.data["x"], "hello world");

  model = Parse("x = 12; y = x * x; z = x + \" squared = \" + y;");
  RunModel(model);
  EXPECT_EQ(model.data["z"], "12 squared = 144");

  model = Parse("x = \"hello\"; z = \"x=\" + x;");
  RunModel(model);
  EXPECT_EQ(model.data["z"], "x=hello");

  model = Parse("x = \"hello \" + 123 + \" there \"; x = x + x;");
  RunModel(model);
  EXPECT_EQ(model.data["x"], "hello 123 there hello 123 there ");

  model = Parse("x = \"hello \" + 123 + 123;");
  RunModel(model);
  EXPECT_EQ(model.data["x"], "hello 123123");
}
function TestTokenizeKeywords() {
  var str = "form";
  var tokens = TokenizeForTest(str);
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.FORM_KEYWORD);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 4);
  EXPECT_EQ("form", str.substr(tokens[0][1], tokens[0][2]));

  str = "page";
  tokens = TokenizeForTest(str);
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.PAGE_KEYWORD);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 4);
  EXPECT_EQ("page", str.substr(tokens[0][1], tokens[0][2]));

  str = "print";
  tokens = TokenizeForTest(str);
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.PRINT_KEYWORD);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 5);
  EXPECT_EQ("print", str.substr(tokens[0][1], tokens[0][2]));

  str = "button";
  tokens = TokenizeForTest(str);
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], interview.BUTTON_KEYWORD);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 6);
  EXPECT_EQ("button", str.substr(tokens[0][1], tokens[0][2]));
}
function TestDefaultNavigation() {
  var model = Parse(
      "form US1040 " +
      "form Schedule_A " +

      "page start " +
      "form US1040 " +
      "print zzzz\"You are at the start. What is going on?zzzz\" " +

      "page page2 " +
      "form US1040 " +
      "print zzzz\"You are at page2.zzzz\" " +

      "page page3 " +
      "form Schedule_A " +
      "print zzzz\"You are at page3.zzzz\" "
  );
  var form = document.createElement("form");
  document.body.appendChild(form);
  RenderModel(model, form);
  EXPECT_SUBSTR(form.innerHTML, "You are at the start.");
  EXPECT_SUBSTR(form.innerHTML, "Form: US1040");
  EXPECT_SUBSTR(form.innerHTML, "Page: start");
  EXPECT_EQ(model.hasOwnProperty("RenderPrevPage"), false);
  EXPECT_EQ(model.hasOwnProperty("RenderNextPage"), true);
  model.RenderNextPage();
  EXPECT_SUBSTR(form.innerHTML, "You are at page2.");
  EXPECT_SUBSTR(form.innerHTML, "Form: US1040");
  EXPECT_SUBSTR(form.innerHTML, "Page: page2");
  EXPECT_EQ(model.hasOwnProperty("RenderPrevPage"), true);
  EXPECT_EQ(model.hasOwnProperty("RenderNextPage"), true);
  EXPECT_SUBSTR(form.innerHTML, "Form: US1040");
  model.RenderNextPage();
  EXPECT_SUBSTR(form.innerHTML, "You are at page3.");
  EXPECT_SUBSTR(form.innerHTML, "Form: Schedule_A");
  EXPECT_SUBSTR(form.innerHTML, "Page: page3");
  EXPECT_EQ(model.hasOwnProperty("RenderPrevPage"), true);
  EXPECT_EQ(model.hasOwnProperty("RenderNextPage"), false);
  model.RenderPrevPage();
  model.RenderPrevPage();
  EXPECT_SUBSTR(form.innerHTML, "What is going on?");
  EXPECT_SUBSTR(form.innerHTML, "Form: US1040");
  EXPECT_SUBSTR(form.innerHTML, "Page: start");
  EXPECT_EQ(model.hasOwnProperty("RenderPrevPage"), false);
  EXPECT_EQ(model.hasOwnProperty("RenderNextPage"), true);
  // For manual testing, don't remove the form element.
  form.remove();
  // TODO: Implement and test all the remaining buttons:
  // History, Data { Back to Form, Clear },
}
function TestDeveloperMode() {
  var model = Parse("");
  var form = document.createElement("form");
  document.body.appendChild(form);
  RenderModel(model, form);
  EXPECT_EQ(model.hasOwnProperty("RenderPrevPage"), false);
  EXPECT_EQ(model.hasOwnProperty("RenderNextPage"), false);
  EXPECT_EQ(model.hasOwnProperty("Reload"), false);
  model.DeveloperMode();
  EXPECT_EQ(model.hasOwnProperty("Reload"), true);
  var text = model.dev_mode_textbox;
  EXPECT_SUBSTR(text, "model_def_");
  // Write a new model dynamically
  document.getElementById(text).value = "page a page b page c";
  model.Reload(model);
  // The old model is dead. Long live the new model.
  model = window.model;
  EXPECT_EQ(model.hasOwnProperty("RenderPrevPage"), false);
  EXPECT_EQ(model.hasOwnProperty("RenderNextPage"), true);
  EXPECT_EQ(model.current_page, "a");
  model.RenderNextPage();
  EXPECT_EQ(model.hasOwnProperty("RenderPrevPage"), true);
  EXPECT_EQ(model.hasOwnProperty("RenderNextPage"), true);
  EXPECT_EQ(model.current_page, "b");
  model.RenderNextPage();
  EXPECT_EQ(model.hasOwnProperty("RenderPrevPage"), true);
  EXPECT_EQ(model.hasOwnProperty("RenderNextPage"), false);
  EXPECT_EQ(model.current_page, "c");
  // For manual testing, don't remove the form element.
  form.remove();
}
function TestPrintWithData() {
  var str =   "form foo " +
    "page one " +
    "x = 1; " +
    "s = \"hello\";" +
    "z = \"x=\" + x;" +
    "z = z + \", s=\" + s;\n" +
    "print z\n";
  var model = Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  RenderModel(model, form);
  EXPECT_SUBSTR(form.innerHTML, "x=1, s=hello");
  // For manual testing, don't remove the form element.
  form.remove();
}
function TestPageNavigation() {
  var model = Parse(
      "form US1040 " +

      "page start " +
      "print \" You are at start.\" " +
      "button foo " +
      "button bar " +
      "button baz " +
      "print zzzz\"More Choices?zzzz\" " +
      "button x1 " +
      "button x2 " +
      
      "page x1 " +
      "print \"x1\" " +
      
      "page x2 " +
      "print \"x2\" " +
      "button start " +

      "page foo " +
      "print \"You chose foo!\" " +
      "button start button bar button baz " +

      "page bar " +
      "print \"You chose bar!\" " +
      "button start button baz " +

      "page baz " +
      "print zzzz\" You chose baz! zzzz\" " +
      "button start ");
  var form = document.createElement("form");
  document.body.appendChild(form);
  RenderModel(model, form);
  EXPECT_SUBSTR(form.innerHTML, "Page: start");
  // I was expecting "\"" instead of "&quot;"
  // Might be browser dependent?
  var quote = "&quot;"; 
  var prefix = "onclick=\"model.GoToPage(" + quote;
  var suffix = quote + ")\">";
  EXPECT_SUBSTR(form.innerHTML, prefix + "foo" + suffix);
  EXPECT_SUBSTR(form.innerHTML, prefix + "bar" + suffix);
  EXPECT_SUBSTR(form.innerHTML, prefix + "baz" + suffix);
  EXPECT_SUBSTR(form.innerHTML, prefix + "x1" + suffix);
  EXPECT_SUBSTR(form.innerHTML, prefix + "x2" + suffix);
  // TODO: Figure out how to click the button instead of calling the method.
  model.GoToPage("foo");
  EXPECT_SUBSTR(form.innerHTML, "Page: foo");
  EXPECT_SUBSTR(form.innerHTML, "You chose foo!");
  EXPECT_SUBSTR(form.innerHTML, prefix + "start" + suffix);
  EXPECT_SUBSTR(form.innerHTML, prefix + "bar" + suffix);
  EXPECT_SUBSTR(form.innerHTML, prefix + "baz" + suffix);

  // For manual testing, don't remove the form element.
  form.remove();
}
function TestInputStatements() {
  var str = "form US1040\n" +
    "\n" +
    "page enter\n" +
    "print \"line1\"\n" +
    "input line1\n" +
    "print \"line2\"\n" +
    "input line2\n" +
    "print \"\"\n" +
    "\n" +
    "page assign\n" +
    "line1 = \"foo\";\n" +
    "line2 = 213;\n" +
    "\n" +
    "page show\n" +
    "z = \"The new value of line1 is \" + line1;\n" +
    "print z\n" +
    "z = \"The new value of line2 is \" + line2;\n" +
    "print z\n" +
    "print \"Now overriding line1 after printing.\"\n" +
    "print \"Now go back to start.\"\n";
  var model = Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  RenderModel(model, form);
  EXPECT_SUBSTR(form.innerHTML, "Page: enter");
  var inputs = document.getElementsByTagName('input');
  EXPECT_EQ(inputs[0].name, "line1");
  EXPECT_EQ(inputs[0].value, "");
  EXPECT_EQ(inputs[1].name, "line2");
  EXPECT_EQ(inputs[1].value, "");
  model.GoToPage("show");
  EXPECT_SUBSTR(form.innerHTML, "The new value of line1 is undefined");
  EXPECT_SUBSTR(form.innerHTML, "The new value of line2 is undefined");
  model.GoToPage("enter");
  EXPECT_EQ(inputs[0].name, "line1");
  EXPECT_EQ(inputs[0].value, "");
  EXPECT_EQ(inputs[1].name, "line2");
  EXPECT_EQ(inputs[1].value, "");

  inputs[0].value = 777;
  inputs[0].onblur();
  inputs[1].value = "hello";
  inputs[1].onblur();
  model.GoToPage("show");
  EXPECT_SUBSTR(form.innerHTML, "The new value of line1 is 777");
  EXPECT_SUBSTR(form.innerHTML, "The new value of line2 is hello");
  model.GoToPage("enter");
  EXPECT_EQ(inputs[0].name, "line1");
  EXPECT_EQ(inputs[0].value, 777);
  EXPECT_EQ(inputs[1].name, "line2");
  EXPECT_EQ(inputs[1].value, "hello");

  model.GoToPage("assign");
  model.GoToPage("show");
  EXPECT_SUBSTR(form.innerHTML, "The new value of line1 is foo");
  EXPECT_SUBSTR(form.innerHTML, "The new value of line2 is 213");
  model.GoToPage("enter");
  EXPECT_EQ(inputs[0].name, "line1");
  EXPECT_EQ(inputs[0].value, "foo");
  EXPECT_EQ(inputs[1].name, "line2");
  EXPECT_EQ(inputs[1].value, 213);

  // For manual testing, don't remove the form element.
  form.remove();
}
function TestRenderingRunsTheTopCodeForAllPages() {
   var str = "/* This should run on every page */\n" +
    "x = 11;\n" +
    "y = \"hello\";\n" +
    "print x\n" +
    "print y\n" +
    "\n" +
    "page one\n" +
    "  print \"did it work?\"\n" +
    "\n" +
    "page two\n" +
    "  print \"did it work?\"\n";
  var model = Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  RenderModel(model, form);
  EXPECT_SUBSTR(form.innerHTML, "Page: one");
  EXPECT_SUBSTR(form.innerHTML, "11");
  EXPECT_SUBSTR(form.innerHTML, "hello");
  model.GoToPage("two");
  EXPECT_SUBSTR(form.innerHTML, "Page: two");
  EXPECT_SUBSTR(form.innerHTML, "11");
  EXPECT_SUBSTR(form.innerHTML, "hello");

  // For manual testing, don't remove the form element.
  form.remove();
}
function TestBasicFormsLowLevel() {
  var model = {};
  interview.InitForms(model);
  interview.SetForm(model, "US1040");
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormIdx(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 1);
  interview.SetForm(model, "US_W2");
  EXPECT_EQ(model.curr_form, "US_W2");
  EXPECT_EQ(interview.GetFormIdx(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 1);
  EXPECT_EQ(model.num_form_copies["US1040"], 1);
  EXPECT_EQ(model.num_form_copies["US_W2"], 1);

  interview.SetForm(model, "US1040");
  EXPECT_EQ(model.curr_form, "US1040");
  interview.GetDataObj(model).line_1 = "Hello 1040";
  interview.SetForm(model, "US_W2");
  EXPECT_EQ(model.curr_form, "US_W2");
  interview.GetDataObj(model).line_1 = "Hello W2";
  interview.SetForm(model, "US1040");
  EXPECT_EQ(interview.GetDataObj(model).line_1, "Hello 1040");
  interview.SetForm(model, "US_W2");
  EXPECT_EQ(interview.GetDataObj(model).line_1, "Hello W2");
}
function TestMultipleCopiesOfFormsLowLevel() {
  var model = {};
  interview.InitForms(model);
  interview.SetForm(model, "US1040");
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormIdx(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 1);
  interview.GetDataObj(model).line_1 = "First Copy";
  interview.NewFormCopy(model);
  EXPECT_EQ(interview.GetFormIdx(model), 1);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  interview.GetDataObj(model).line_1 = "Second Copy";

  interview.IncrementFormIdx(model, -1);
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormIdx(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "First Copy");

  interview.IncrementFormIdx(model, 0);
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormIdx(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "First Copy");

  interview.IncrementFormIdx(model, 1);
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormIdx(model), 1);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "Second Copy");

  // Go past the bounds
  interview.IncrementFormIdx(model, -2);
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormIdx(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "First Copy");

  interview.IncrementFormIdx(model, 2);
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormIdx(model), 1);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "Second Copy");
}
function TestDeleteFormLowLevel() {
  var model = {};
  interview.InitForms(model);
  interview.SetForm(model, "US1040");
  interview.GetDataObj(model).line_1 = "US1040 Copy 0";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 1";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 2";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 3";
  EXPECT_EQ(interview.GetNumFormCopies(model), 4);

  interview.SetFormIdx(model, 2);
  EXPECT_EQ(interview.GetFormIdx(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 2");

  // Unit under test
  interview.DeleteFormCopy(model);

  EXPECT_EQ(interview.GetNumFormCopies(model), 3);
  EXPECT_EQ(interview.GetFormIdx(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 3");
  interview.SetFormIdx(model, 3);
  EXPECT_EQ(interview.GetFormIdx(model), 2);
  interview.SetFormIdx(model, 1);
  EXPECT_EQ(interview.GetFormIdx(model), 1);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 1");
}
function TestDeleteLastFormLowLevel() {
  var model = {};
  interview.InitForms(model);
  interview.SetForm(model, "US1040");
  interview.GetDataObj(model).line_1 = "US1040 Copy 0";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 1";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 2";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 3";
  EXPECT_EQ(interview.GetNumFormCopies(model), 4);

  interview.SetFormIdx(model, 3);
  EXPECT_EQ(interview.GetFormIdx(model), 3);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 3");

  // unit under test
  interview.DeleteFormCopy(model);

  EXPECT_EQ(interview.GetNumFormCopies(model), 3);
  EXPECT_EQ(interview.GetFormIdx(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 2");
  interview.SetFormIdx(model, 3);
  EXPECT_EQ(interview.GetFormIdx(model), 2);
}
function TestDeleteFirstFormLowLevel() {
  var model = {};
  interview.InitForms(model);
  interview.SetForm(model, "US1040");
  interview.GetDataObj(model).line_1 = "US1040 Copy 0";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 1";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 2";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 3";
  EXPECT_EQ(interview.GetNumFormCopies(model), 4);

  interview.SetFormIdx(model, 0);
  EXPECT_EQ(interview.GetFormIdx(model), 0);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 0");

  // unit under test
  interview.DeleteFormCopy(model);

  EXPECT_EQ(interview.GetNumFormCopies(model), 3);
  EXPECT_EQ(interview.GetFormIdx(model), 0);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 1");
  interview.IncrementFormIdx(model, 1);
  EXPECT_EQ(interview.GetFormIdx(model), 1);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 2");
  interview.IncrementFormIdx(model, 1);
  EXPECT_EQ(interview.GetFormIdx(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 3");
}
function TestMultipleCopiesOfFormsComplexLowLevel() {
  var model = {};
  interview.InitForms(model);
  interview.SetForm(model, "US1040");
  interview.GetDataObj(model).line_1 = "US1040 Copy 0";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 1";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 2";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US1040 Copy 3";
  interview.SetForm(model, "US_W2");
  interview.GetDataObj(model).line_1 = "US_W2 Copy 0";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US_W2 Copy 1";
  interview.NewFormCopy(model);
  interview.GetDataObj(model).line_1 = "US_W2 Copy 2";

  interview.SetForm(model, "US1040");
  EXPECT_EQ(interview.GetFormIdx(model), 3);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 3");
  interview.SetFormIdx(model, 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 2");
  interview.IncrementFormIdx(model, -2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 0");

  interview.SetForm(model, "US_W2");
  EXPECT_EQ(interview.GetFormIdx(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US_W2 Copy 2");

  interview.SetForm(model, "US1040");
  EXPECT_EQ(interview.GetFormIdx(model), 0);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 0");
  interview.NewFormCopy(model);
  EXPECT_EQ(interview.GetFormIdx(model), 4);
  interview.DeleteFormCopy(model);
  EXPECT_EQ(interview.GetFormIdx(model), 3);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 3");

  interview.SetForm(model, "US_W2");
  EXPECT_EQ(interview.GetFormIdx(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US_W2 Copy 2");
  interview.DeleteFormCopy(model);
  EXPECT_EQ(interview.GetFormIdx(model), 1);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US_W2 Copy 1");
}
function TestBasicForms() {
  var str = "button init button a button b button c\n" +
    "page init\n" +
    "  form one\n" +
    "    line_1 = \"Current Form: one\";\n" +
    "  form two\n" +
    "    line_1 = \"Current Form: two\";\n" +
    "page a\n" +
    "  form one\n" +
    "  print line_1\n" +
    "page b\n" +
    "  form two\n" +
    "  print line_1\n" +
    "page c\n" +
    "  print line_1\n";
  var model = Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  RenderModel(model, form);
  // There are 3 forms because there is also a default form with empty name.
  // I had to add a default form with empty name because otherwise too many
  // unit tests would break.
  EXPECT_EQ(Object.keys(model.curr_form_idx).length, 3);
  EXPECT_EQ(model.curr_form, "two");
  model.GoToPage("a");
  EXPECT_EQ(model.curr_form, "one");
  EXPECT_SUBSTR(form.innerHTML, "Current Form: one");
  model.GoToPage("b");
  EXPECT_EQ(model.curr_form, "two");
  EXPECT_SUBSTR(form.innerHTML, "Current Form: two");
  // This next part checks that the current form is retained between pages.
  // TODO: Do we want this behavior?
  model.GoToPage("b");
  model.GoToPage("c");
  EXPECT_EQ(model.curr_form, "two");
  EXPECT_SUBSTR(form.innerHTML, "Current Form: two");
  model.GoToPage("a");
  model.GoToPage("c");
  EXPECT_EQ(model.curr_form, "one");
  EXPECT_SUBSTR(form.innerHTML, "Current Form: one");
  // For manual testing, don't remove the form element.
  form.remove();
}
function TestGotoKeyword() {
  var str = "button a\n" +
    "button b\n" +
    "print \"\"\n" +
    "\n" +
    "page c\n" +
    "  print \"hello c\"\n" +
    "\n" +
    "page a\n" +
    "  print \"hello a\"\n" +
    "  goto c\n" +
    "\n" +
    "page b\n" +
    "  print \"hello b\"\n" +
    "  goto c\n";
  var model = Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  RenderModel(model, form);
  EXPECT_NOT_SUBSTR(form.innerHTML, "hello a");
  EXPECT_NOT_SUBSTR(form.innerHTML, "hello b");
  EXPECT_SUBSTR(form.innerHTML, "hello c");
  model.GoToPage("a");
  EXPECT_SUBSTR(form.innerHTML, "hello a");
  EXPECT_NOT_SUBSTR(form.innerHTML, "hello b");
  EXPECT_SUBSTR(form.innerHTML, "hello c");
  model.GoToPage("b");
  EXPECT_NOT_SUBSTR(form.innerHTML, "hello a");
  EXPECT_SUBSTR(form.innerHTML, "hello b");
  EXPECT_SUBSTR(form.innerHTML, "hello c");
  // For manual testing, don't remove the form element.
  form.remove();
}
function TestGotoKeywordInHeader() {
  var str = "button a\n" +
    "goto b\n" +
    "page a\n" +
    "page b\n";
  try {
    var model = Parse(str);
    FAIL("Should throw an error because of goto in header but didn't.");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Cannot use the goto keyword in the model header.\n" +
        "idx = 9\n" +
        "button a\n" +
        "g/* Here */oto b\n" +
        "page a\n" +
        "page b\n");
  }
}
function TestCreateMultipleCopiesOfForms() {
  var str = "form US1040\n" +
    "\n" +
    "page edit_w2\n" +
    "  form W2\n" +
    "  input employer\n" +
    "  print \"\"\n" +
    "  button prev_w2\n" +
    "  button next_w2\n" +
    "  print \"\"\n" +
    "  button new_w2\n" +
    "\n" +
    "page next_w2\n" +
    "  form W2\n" +
    "  nextcopy\n" +
    "  goto edit_w2\n" +
    "\n" +
    "page prev_w2\n" +
    "  form W2\n" +
    "  prevcopy\n" +
    "  goto edit_w2\n" +
    "\n" +
    "page new_w2\n" +
    "  form W2\n" +
    "  newcopy\n" +
    "  goto edit_w2\n";
  var model = Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  RenderModel(model, form);
  EXPECT_SUBSTR(form.innerHTML, "Form: W2[0]");
  EXPECT_SUBSTR(form.innerHTML, "Page: edit_w2");
  var inputs = document.getElementsByTagName('input');
  EXPECT_EQ(inputs[0].name, "employer");
  inputs[0].value = "Employer 1";
  inputs[0].onblur();
  model.GoToPage("new_w2");
  EXPECT_SUBSTR(form.innerHTML, "Form: W2[1]");
  EXPECT_SUBSTR(form.innerHTML, "Page: edit_w2");
  inputs[0].value = "Employer 2";
  inputs[0].onblur();
  model.GoToPage("prev_w2");
  EXPECT_EQ(inputs[0].value, "Employer 1");
  model.GoToPage("prev_w2");
  EXPECT_EQ(inputs[0].value, "Employer 1");
  model.GoToPage("next_w2");
  EXPECT_EQ(inputs[0].value, "Employer 2");
  model.GoToPage("next_w2");
  EXPECT_EQ(inputs[0].value, "Employer 2");
  // For manual testing, don't remove the form element.
  form.remove();
}
function TestAll() {
  console.log("Testing: START");
  TestTokenizeNumbers();
  TestTokenizeOneToken();
  TestTokenizeManyTokens();
  TestTokenizeBadNumbers();
  TestCleanTokens();
  TestParseAndRunAssignments();
  TestParseAndRunAssignmentsWithState();
  TestValidatingAssignments();
  TestValidatingFormExpressions();
  TestTokenizeIdDelimitedStrings();
  TestEvaluateStrings();
  TestStringAddition();
  TestTokenizeKeywords();
  TestDefaultNavigation();
  TestDeveloperMode();
  TestPrintWithData();
  TestPageNavigation();
  TestInputStatements();
  TestRenderingRunsTheTopCodeForAllPages(); 
  TestBasicFormsLowLevel();
  TestMultipleCopiesOfFormsLowLevel();
  TestDeleteFormLowLevel();
  TestDeleteLastFormLowLevel();
  TestDeleteFirstFormLowLevel();
  TestMultipleCopiesOfFormsComplexLowLevel();
  TestBasicForms();
  TestGotoKeyword();
  TestGotoKeywordInHeader();
  TestCreateMultipleCopiesOfForms();
  console.log("Testing: DONE");
}
TestAll();


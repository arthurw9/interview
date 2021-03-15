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

function TokenizeForTest(str) {
  var model = {};
  model.text = str;
  Tokenize(model);
  return model.tokens;
}
function TestTokenizeNumbers() {
  var model = {};
  model.text = "1020339";
  Tokenize(model);
  var tokens = model.tokens;
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], NUMBER_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 7);

  model = {};
  model.text = "1020.339";
  Tokenize(model);
  tokens = model.tokens;
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], NUMBER_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 8);

  try {
    model = {};
    model.text = "1020.33.9";
    Tokenize(model);
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
  Tokenize(model);
  tokens = model.tokens;
  EXPECT_EQ(tokens.length, 2);
  EXPECT_EQ(tokens[0][0], NUMBER_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 7);
  EXPECT_EQ(tokens[1][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[1][1], 7);
  EXPECT_EQ(tokens[1][2], 1);

  tokens = TokenizeForTest("a990.33");
  EXPECT_EQ(tokens.length, 3);
  EXPECT_EQ(tokens[0][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 4);
  EXPECT_EQ(tokens[1][0], ".");
  EXPECT_EQ(tokens[1][1], 4);
  EXPECT_EQ(tokens[1][2], 1);
  EXPECT_EQ(tokens[2][0], NUMBER_TOKEN);
  EXPECT_EQ(tokens[2][1], 5);
  EXPECT_EQ(tokens[2][2], 2);
}
function TestTokenizeOneToken() {
  var tokens = TokenizeForTest(" \n\r\t ");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 5);

  tokens = TokenizeForTest("aabb09A_sdf");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 11);

  tokens = TokenizeForTest("/* Hello world 123 \" *&^  /* haha */");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], COMMENT_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 36);
  EXPECT_EQ("/* Hello world 123 \" *&^  /* haha */".length, 36);

  var s = "\"Hello world /* blah blah */ 23123\"";
  tokens = TokenizeForTest(s);
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], STRING_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 35);
  EXPECT_EQ(s.length, 35);
}
function TestTokenizeManyTokens() {
  var tokens = TokenizeForTest(" xXx =   yY09;\n alert();");
  EXPECT_EQ(tokens.length, 12);
  var token_num = 0;
  EXPECT_EQ(tokens[token_num][0], WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 1);
  EXPECT_EQ(tokens[token_num][2], 3);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 4);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], "=");
  EXPECT_EQ(tokens[token_num][1], 5);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 6);
  EXPECT_EQ(tokens[token_num][2], 3);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 9);
  EXPECT_EQ(tokens[token_num][2], 4);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], ";");
  EXPECT_EQ(tokens[token_num][1], 13);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 14);
  EXPECT_EQ(tokens[token_num][2], 2);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], IDENTIFIER_TOKEN);
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
  EXPECT_EQ(tokens[token_num][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 1);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], '=');
  EXPECT_EQ(tokens[token_num][1], 2);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 3);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], STRING_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 4);
  EXPECT_EQ(tokens[token_num][2], 22);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], ";");
  EXPECT_EQ(tokens[token_num][1], 26);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 27);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], COMMENT_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 28);
  EXPECT_EQ(tokens[token_num][2], 15);
}
function TestTokenizeBadNumbers() {
  var tokens = TokenizeForTest("xx999.0993");
  EXPECT_EQ(tokens.length, 3);
  var token_num = 0;
  EXPECT_EQ(tokens[token_num][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 5);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], ".");
  EXPECT_EQ(tokens[token_num][1], 5);
  EXPECT_EQ(tokens[token_num][2], 1);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], NUMBER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 6);
  EXPECT_EQ(tokens[token_num][2], 4);

  tokens = TokenizeForTest("999xyz");
  EXPECT_EQ(tokens.length, 2);
  token_num = 0;
  EXPECT_EQ(tokens[token_num][0], NUMBER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 3);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 3);
  EXPECT_EQ(tokens[token_num][2], 3);

  tokens = TokenizeForTest("999.xyz");
  EXPECT_EQ(tokens.length, 2);
  token_num = 0;
  EXPECT_EQ(tokens[token_num][0], NUMBER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 4);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 4);
  EXPECT_EQ(tokens[token_num][2], 3);

  tokens = TokenizeForTest("999.345xyz");
  EXPECT_EQ(tokens.length, 2);
  token_num = 0;
  EXPECT_EQ(tokens[token_num][0], NUMBER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 0);
  EXPECT_EQ(tokens[token_num][2], 7);
  ++token_num;
  EXPECT_EQ(tokens[token_num][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[token_num][1], 7);
  EXPECT_EQ(tokens[token_num][2], 3);
}
function TestCleanTokens() {
  var text = "  x /* hi */ = y 100.0 \" \" ;";
  var tokens = TokenizeForTest(text)
  EXPECT_EQ(tokens.length, 14);
  tokens = CleanTokens(tokens, text);
  EXPECT_EQ(tokens.length, 6);
  var idx = 0;
  EXPECT_EQ(tokens[idx][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[idx][1], 2);
  EXPECT_EQ(tokens[idx][2], 1);
  ++idx;
  EXPECT_EQ(tokens[idx][0], "=");
  EXPECT_EQ(tokens[idx][1], 13);
  EXPECT_EQ(tokens[idx][2], 1);
  ++idx;
  EXPECT_EQ(tokens[idx][0], IDENTIFIER_TOKEN);
  EXPECT_EQ(tokens[idx][1], 15);
  EXPECT_EQ(tokens[idx][2], 1);
  ++idx;
  EXPECT_EQ(tokens[idx][0], NUMBER_TOKEN);
  EXPECT_EQ(tokens[idx][1], 17);
  EXPECT_EQ(tokens[idx][2], 5);
  ++idx;
  EXPECT_EQ(tokens[idx][0], STRING_TOKEN);
  EXPECT_EQ(tokens[idx][1], 23);
  EXPECT_EQ(tokens[idx][2], 3);
  ++idx;
  EXPECT_EQ(tokens[idx][0], ";");
  EXPECT_EQ(tokens[idx][1], 27);
  EXPECT_EQ(tokens[idx][2], 1);
}
function TestParseSimpleStatements() {
  var model = Parse("x = \"hello world\";");
  EXPECT_EQ(model.statement_list.length, 1);
  EXPECT_EQ(model.statement_list[0].first_token_idx, 0);
  EXPECT_EQ(model.statement_list[0].last_token_idx, 3);

  model = Parse("x = 1; y = 2;");
  EXPECT_EQ(model.statement_list.length, 2);
  EXPECT_EQ(model.statement_list[0].first_token_idx, 0);
  EXPECT_EQ(model.statement_list[0].last_token_idx, 3);
  EXPECT_EQ(model.statement_list[1].first_token_idx, 4);
  EXPECT_EQ(model.statement_list[1].last_token_idx, 7);

  try {
    model = Parse(" /* irrelevant */ x = \"needs a ;\"");
    FAIL("Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Unterminated Statement.\nidx = 18\n" +
        " /* irrelevant */ x/* Here */ = \"needs a ;\"");
  }
}
function TestParseExpression() {
  var model = Parse("x = 13;");
  EXPECT_EQ(model.statement_list[0].name, "x");
  expr = model.statement_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "13");
  EXPECT_EQ(expr.type, NUMBER_TOKEN);
  EXPECT_EQ(expr.right, 13);
  EXPECT_EQ(model.token_idx, 4);
  EXPECT_EQ(Evaluate(model, expr), 13);

  model = Parse("x = 1 + 2 + 3;");
  expr = model.statement_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "1 2 + 3 +");
  EXPECT_EQ(expr.type, "+");
  EXPECT_EQ(expr.right.type, NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 3);
  expr = expr.left;
  EXPECT_EQ(expr.type, "+");
  EXPECT_EQ(expr.right.type, NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 2);
  EXPECT_EQ(expr.left.type, NUMBER_TOKEN);
  EXPECT_EQ(expr.left.right, 1);
  EXPECT_EQ(model.token_idx, 8);
  expr = model.statement_list[0].expression;
  EXPECT_EQ(Evaluate(model, expr), 6);

  model = Parse("x = 10 - 2 - 4;");
  expr = model.statement_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "10 2 - 4 -");
  EXPECT_EQ(expr.type, "-");
  EXPECT_EQ(expr.right.type, NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 4);
  expr = expr.left;
  EXPECT_EQ(expr.type, "-");
  EXPECT_EQ(expr.right.type, NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 2);
  EXPECT_EQ(expr.left.type, NUMBER_TOKEN);
  EXPECT_EQ(expr.left.right, 10);
  EXPECT_EQ(model.token_idx, 8);
  expr = model.statement_list[0].expression;
  EXPECT_EQ(Evaluate(model, expr), 4);

  model = Parse("x = 2 * 4 * 9;");
  expr = model.statement_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "2 4 * 9 *");
  EXPECT_EQ(Evaluate(model, expr), 72);

  model = Parse("x = 64 / 4 / 2;");
  expr = model.statement_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "64 4 / 2 /");
  EXPECT_EQ(Evaluate(model, expr), 8);

  model = Parse("x = 1 + 4 * 9 / 2 - 5;");
  expr = model.statement_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "1 4 9 * 2 / + 5 -");
  EXPECT_EQ(Evaluate(model, expr), 14);

  model = Parse("x = (((6 - 2 -2)));");
  expr = model.statement_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr),
            "6 2 - 2 -");
  EXPECT_EQ(Evaluate(model, expr), 2);

  model = Parse("x = 1 + (1 + 3) * 3 / 2 / 2;");
  expr = model.statement_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr),
            "1 1 3 + 3 * 2 / 2 / +");
  EXPECT_EQ(Evaluate(model, expr), 4);

  model = Parse("x = (11 * 5 - 50);");
  expr = model.statement_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr),
            "11 5 * 50 -");
  EXPECT_EQ(Evaluate(model, expr), 5);

  model = Parse("x = (6 - 2 -2) * (1 + (1 + 3) * 3 / 2 / 2) - (11 * 5 - 50);");
  expr = model.statement_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr),
            "6 2 - 2 - 1 1 3 + 3 * 2 / 2 / + * 11 5 * 50 - -");
  EXPECT_EQ(Evaluate(model, expr), 3);
}
function TestAll() {
  TestTokenizeNumbers();
  TestTokenizeOneToken();
  TestTokenizeManyTokens();
  TestTokenizeBadNumbers();
  TestCleanTokens();
  var o = {};
  TestParseSimpleStatements();
  TestParseExpression();
  console.log("Test Complete.");
}
TestAll();


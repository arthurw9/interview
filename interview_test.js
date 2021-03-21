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
function TestParseAndRunAssignments() {
  var model = Parse("x = \"hello world\";");
  EXPECT_EQ(model.expression_list.length, 1);
  EXPECT_EQ(model.expression_list[0].first_token_idx, 0);
  EXPECT_EQ(model.expression_list[0].last_token_idx, 3);
  var expr = model.expression_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "x \"hello world\" =");
  RunModel(model);
  EXPECT_EQ(model.data["x"], "\"hello world\"");

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

  try {
    model = Parse(" /* irrelevant */ x = \"needs a ;\"");
    FAIL("Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err,
        "ERROR: Unterminated Statement. Expected ; semicolon.\nidx = 18\n" +
        " /* irrelevant */ x/* Here */ = \"needs a ;\"");
  }

  model = Parse("x = 13;");
  expr = model.expression_list[0].expression;
  EXPECT_EQ(ExpressionDebugString(model, expr), "x 13 =");
  EXPECT_EQ(expr.type, "=");
  EXPECT_EQ(expr.left.type, IDENTIFIER_TOKEN);
  EXPECT_EQ(expr.left.right, "x");
  expr = expr.right;
  EXPECT_EQ(expr.type, NUMBER_TOKEN);
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
  EXPECT_EQ(expr.right.type, NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 3);
  expr = expr.left;
  EXPECT_EQ(expr.type, "+");
  EXPECT_EQ(expr.right.type, NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 2);
  EXPECT_EQ(expr.left.type, NUMBER_TOKEN);
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
  EXPECT_EQ(expr.right.type, NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 4);
  expr = expr.left;
  EXPECT_EQ(expr.type, "-");
  EXPECT_EQ(expr.right.type, NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 2);
  EXPECT_EQ(expr.left.type, NUMBER_TOKEN);
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
function TestTokenizeIdDelimitedStrings() {
  var tokens = TokenizeForTest("\"hello\n\n\rworld\"");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], STRING_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 15);

  tokens = TokenizeForTest("abc\"hello\n\n\rworldabc\"");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], STRING_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 21);

  tokens = TokenizeForTest("abc\"hello\n\"\n\rworldabc\"");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], STRING_TOKEN);
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
  EXPECT_EQ(tokens[0][0], STRING_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 13);

  tokens = TokenizeForTest("abc\"abcabcabc'abc`abc\"");
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], STRING_TOKEN);
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 22);

  s = " zzzz\"Typical usage\n\n \"hi!\" zzzz false alarm. zzzz\" ";
  tokens = TokenizeForTest(s);
  EXPECT_EQ(tokens.length, 3);
  EXPECT_EQ(tokens[0][0], WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[1][0], STRING_TOKEN);
  EXPECT_EQ(tokens[2][0], WHITE_SPACE_TOKEN);
  EXPECT_EQ(tokens[1][1], 1);
  EXPECT_EQ(s.length, 52);
  EXPECT_EQ(tokens[1][2], 50);
}
function TestFormNavigation() {
  // TODO: Enable this test.
  return;
  var model = Parse(
      "form US1040 " +

      "page start " +
      "message zzzz\" You are at start. What is going on? zzzz\" " +
      "choices [foo bar baz fall1 fall2]" +
      "next start " +
      
      "page fall1 " +
      "message zzzz\" The next page will be by default zzzz\" " +
      
      "page fall2 " +
      "message zzzz\" You made it! zzzz\" " +
      "next start " +

      "page foo " +
      "message zzzz\" You chose foo! zzzz\" " +
      "choices [start bar baz] " +
      "next foo " +

      "page bar " +
      "message zzzz\" You chose bar! zzzz\" " +
      "choices [start baz] " +
      "next bar " +

      "page baz " +
      "message zzzz\" You chose baz! zzzz\" " +
      "choices [start] " +
      "next baz ");
  console.log(model);
  RunModel(model);
}
function TestAll() {
  TestTokenizeNumbers();
  TestTokenizeOneToken();
  TestTokenizeManyTokens();
  TestTokenizeBadNumbers();
  TestCleanTokens();
  TestParseAndRunAssignments();
  TestParseAndRunAssignmentsWithState();
  TestTokenizeIdDelimitedStrings();
  TestFormNavigation();
  console.log("Test Complete.");
}
TestAll();


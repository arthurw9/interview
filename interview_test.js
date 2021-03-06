function ShowTestName() {
  var hr = document.createElement("hr");
  document.body.appendChild(hr);
  var div = document.createElement("div");
  div.innerHTML = current_test_name;
  document.body.appendChild(div);
  console.log(current_test_name);
  failing_tests[current_test_name] = 1;
}
function Msg() {
  var div = document.createElement("div");
  div.innerHTML = Array.prototype.join.call(arguments, "");
  document.body.appendChild(div);
  console.log(Array.prototype.join.call(arguments, ""));
}
function MsgTrace() {
  var pre = document.createElement("pre");
  pre.innerHTML = Array.prototype.join.call(arguments, "");
  document.body.appendChild(pre);
  var pre2 = document.createElement("pre");
  pre2.innerHTML = Error().stack;
  document.body.appendChild(pre2);
  console.trace(Array.prototype.join.call(arguments, ""));
}
function FAIL(msg) {
  ShowTestName();
  MsgTrace("ERROR: ", msg);
}
function EXPECT_EQ(a, b) {
  if (a==b) return;
  ShowTestName();
  MsgTrace("ERROR: Not Equal: [", a, "] = [", b, "]");
}
function EXPECT_INCLUDES(list, value) {
  if (list.includes(value)) return;
  ShowTestName();
  MsgTrace("ERROR: Does not include [", value, "]: [", list, "]");
}
function EXPECT_SUBSTR(haystack, needle) {
  if (haystack.includes(needle)) return;
  ShowTestName();
  MsgTrace("ERROR: Does contain substring [", needle, "]: [", haystack, "]");
}
function EXPECT_NOT_SUBSTR(haystack, needle) {
  if (haystack.includes(needle)) {
    ShowTestName();
    MsgTrace("ERROR: Contains unexpected substring [", needle, "]: [", haystack, "]");
  }
}
var tests = {};
var async_tests_still_running = {};
var current_test_name = "";
var failing_tests = {};
function DefineTest(name) {
  var t = {};
  if (tests.hasOwnProperty(name)) {
    current_test_name = name;
    FAIL("There is already a test named: " + name);
  }
  t.name = name;
  tests[name] = t;
  return t;
}
function AsyncTest() {
  // Called by Asynchronous tests.
  // Returns the test name which must be passed to AsyncDone() when the test is complete. 
  async_tests_still_running[current_test_name] = 1;
  return current_test_name;
}
function AsyncDone(test_name) {
  // Called when an Asynchronous test completes.
  // test_name must come from AsncTest()
  if (!async_tests_still_running.hasOwnProperty(test_name)) {
    FAIL("AsyncDone called but test is not running: " + test_name);
  } else {
    delete async_tests_still_running[test_name];
  }
  CheckDone();
}
function CheckDone() {
  if (Object.keys(async_tests_still_running).length > 0) {
    // TODO: set a timer?
    return;
  }
  Msg("Testing: DONE");
  Msg("Failing Tests: " + Object.keys(failing_tests).length);
}
function RunTestsRandomly() {
  Msg("Testing: " + Object.keys(tests).length + " tests");
  Msg("Testing: START");
  var tests_to_run = [];
  failing_tests = {};
  for(var name in tests) {
    tests_to_run.push(tests[name]);
  }
  while(tests_to_run.length > 0) {
    var i = Math.floor(Math.random() * tests_to_run.length);
    var curr_test = tests_to_run.splice(i, 1);
    current_test_name = curr_test[0].name;
    try {
      curr_test[0].func();
    } catch(err) {
      FAIL(err.msg + " idx1:" + err.idx1 + " idx2:" + err.idx2 +
           "\njsStack: " + err.jsStack);
    }
  }
  CheckDone();
}
function RunTest(name) {
  current_test_name = name;
  Msg("Testing: " + name);
  try {
    tests[name].func();
  } catch(err) {
    FAIL(err.msg + " idx1:" + err.idx1 + " idx2:" + err.idx2);
  }
  CheckDone();
}
function TokenizeForTest(str) {
  var model = {};
  model.text = str;
  interview.Tokenize(model);
  return model.tokens;
}
DefineTest("TestTokenizeNumbers").func = function() {
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
    EXPECT_EQ(err.msg, "Unexpected second dot in number.");
    EXPECT_EQ(err.idx1, 7);
    EXPECT_EQ(err.idx2, 8);
    EXPECT_EQ(model.text.substr(7,2), ".9");
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
DefineTest("TestTokenizeOneToken").func = function() {
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
DefineTest("TestTokenizeManyTokens").func = function() {
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
DefineTest("TestTokenizeBadNumbers").func = function() {
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
DefineTest("TestCleanTokens").func = function() {
  var text = "  x /* hi */ = y 100.0 \" \" ;";
  var model = {};
  model.text = text;
  interview.Tokenize(model);
  EXPECT_EQ(model.tokens.length, 14);
  interview.CleanTokens(model);
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
DefineTest("TestParseAndRunAssignments").func = function() {
  var model = interview.Parse("x = \"hello world\";");
  EXPECT_EQ(model.expression_list.length, 1);
  EXPECT_EQ(model.expression_list[0].first_token_idx, 0);
  EXPECT_EQ(model.expression_list[0].last_token_idx, 3);
  var expr = model.expression_list[0].expression;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr), "x \"hello world\" =");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], "hello world");

  model = interview.Parse("x = 1; y = 2;");
  EXPECT_EQ(model.expression_list.length, 2);
  EXPECT_EQ(model.expression_list[0].first_token_idx, 0);
  EXPECT_EQ(model.expression_list[0].last_token_idx, 3);
  EXPECT_EQ(model.expression_list[1].first_token_idx, 4);
  EXPECT_EQ(model.expression_list[1].last_token_idx, 7);
  expr = model.expression_list[0].expression;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr), "x 1 =");
  expr = model.expression_list[1].expression;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr), "y 2 =");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 1);
  EXPECT_EQ(model.data["y"], 2);

  // TODO: Should we require a semicolon for the last expression?
  model = interview.Parse(" /* irrelevant */ x = \"doesn't need a ; lol\"");
  expr = model.expression_list[0].expression;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr), "x \"doesn't need a ; lol\" =");

  model = interview.Parse("x = 13;");
  expr = model.expression_list[0].expression;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr), "x 13 =");
  EXPECT_EQ(expr.type, "=");
  EXPECT_EQ(expr.left.type, interview.IDENTIFIER_TOKEN);
  EXPECT_EQ(expr.left.right, "x");
  expr = expr.right;
  EXPECT_EQ(expr.type, interview.NUMBER_TOKEN);
  EXPECT_EQ(expr.right, 13);
  EXPECT_EQ(interview.Evaluate(model, expr), 13);
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 13);

  model = interview.Parse("x = 1 + 2 + 3;");
  expr = model.expression_list[0].expression;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr), "x 1 2 + 3 + =");
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
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 6);

  model = interview.Parse("x = 10 - 2 - 4;");
  EXPECT_EQ(model.token_idx, 8);
  expr = model.expression_list[0].expression;
  EXPECT_EQ(expr.type, "=");
  expr = expr.right;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr), "10 2 - 4 -");
  EXPECT_EQ(expr.type, "-");
  EXPECT_EQ(expr.right.type, interview.NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 4);
  expr = expr.left;
  EXPECT_EQ(expr.type, "-");
  EXPECT_EQ(expr.right.type, interview.NUMBER_TOKEN);
  EXPECT_EQ(expr.right.right, 2);
  EXPECT_EQ(expr.left.type, interview.NUMBER_TOKEN);
  EXPECT_EQ(expr.left.right, 10);
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 4);

  model = interview.Parse("x = 2 * 4 * 9;");
  expr = model.expression_list[0].expression;
  EXPECT_EQ(expr.type, "=");
  expr = expr.right;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr), "2 4 * 9 *");
  EXPECT_EQ(interview.Evaluate(model, expr), 72);
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 72);

  model = interview.Parse("x = 64 / 4 / 2;");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr), "64 4 / 2 /");
  EXPECT_EQ(interview.Evaluate(model, expr), 8);
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 8);

  model = interview.Parse("x = 1 + 4 * 9 / 2 - 5;");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr), "1 4 9 * 2 / + 5 -");
  EXPECT_EQ(interview.Evaluate(model, expr), 14);
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 14);

  model = interview.Parse("x = (((6 - 2 -2)));");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr),
            "6 2 - 2 -");
  EXPECT_EQ(interview.Evaluate(model, expr), 2);
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 2);

  model = interview.Parse("x = 1 + (1 + 3) * 3 / 2 / 2;");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr),
            "1 1 3 + 3 * 2 / 2 / +");
  EXPECT_EQ(interview.Evaluate(model, expr), 4);
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 4);

  model = interview.Parse("x = (11 * 5 - 50);");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr),
            "11 5 * 50 -");
  EXPECT_EQ(interview.Evaluate(model, expr), 5);
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 5);

  model = interview.Parse("x = (6 - 2 -2) * (1 + (1 + 3) * 3 / 2 / 2) - (11 * 5 - 50);");
  expr = model.expression_list[0].expression.right;
  EXPECT_EQ(interview.ExpressionDebugString(model, expr),
            "6 2 - 2 - 1 1 3 + 3 * 2 / 2 / + * 11 5 * 50 - -");
  EXPECT_EQ(interview.Evaluate(model, expr), 3);
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 3);
}
DefineTest("TestParseAndRunAssignmentsWithState").func = function() {
  var model = interview.Parse("x = 1; y = 2; x = x + y; y = y + 2; x = x * y;");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], 12);
  EXPECT_EQ(model.data["y"], 4);
}
DefineTest("TestValidatingAssignments").func = function() {
  try {
    var str = "/* ; blah \" foo ; \" */; x=2;";
    model = interview.Parse(str);
    FAIL("Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err.msg, "Unexpected empty expression.");
    EXPECT_EQ(err.idx1, 22);
    EXPECT_EQ(err.idx2, 23);
    EXPECT_EQ(str.substr(20), "*/; x=2;");
  }

  try {
    var str = "/* ; blah \" foo ; \" */x=;";
    model = interview.Parse(str);
    FAIL("/* ; blah \" foo ; \" */x=; Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err.msg, "Unexpected missing right operand.");
    EXPECT_EQ(err.idx1, 23);
    EXPECT_EQ(err.idx2, 24);
    EXPECT_EQ(str.substr(22), "x=;");
  }

  try {
    model = interview.Parse(" = abc");
    FAIL("Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err.msg, "Can't add = after _start");
    EXPECT_EQ(err.idx1, 1);
    EXPECT_EQ(err.idx2, 2);
  }

  try {
    var str = "abc = ( 3 + 4;";
    model = interview.Parse(str);
    FAIL("Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err.msg, "Unmatched parentheses.");
    EXPECT_EQ(err.idx1, 6);
    EXPECT_EQ(err.idx2, 7);
    EXPECT_EQ(str.substr(6), "( 3 + 4;");
  }

  model = interview.Parse("/* Should empty expressions parse? lol */");
  EXPECT_EQ(model.expression_list.length, 0);
}
DefineTest("TestValidatingFormExpressions").func = function() {
  try {
    model = interview.Parse("Form form");
    FAIL("Form form Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err.msg, "Expected Identifier after form. Found form instead.");
    EXPECT_EQ(err.idx1, 0);
    EXPECT_EQ(err.idx2, 4);
  }
  try {
    model = interview.Parse("Form");
    FAIL("Form Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err.msg, "Expected identifier after form");
    EXPECT_EQ(err.idx1, 0);
    EXPECT_EQ(err.idx2, 4);
  }

  try {
    model = interview.Parse("PAGE pAgE");
    FAIL("PAGE pAgE Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err.msg, "Expected Identifier after page. Found page instead.");
    EXPECT_EQ(err.idx1, 0);
    EXPECT_EQ(err.idx2, 4);
  }

  try {
    model = interview.Parse("PAGE");
    FAIL("PAGE Should throw an error.");
  } catch(err) {
    EXPECT_EQ(err.msg, "Expected identifier after page");
    EXPECT_EQ(err.idx1, 0);
    EXPECT_EQ(err.idx2, 4);
  }
}
DefineTest("TestTokenizeIdDelimitedStrings").func = function() {
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
    EXPECT_EQ(err.msg, "Closing delimiter expected: [abc\"]");
    EXPECT_EQ(err.idx1, 0);
    EXPECT_EQ(err.idx2, 4);
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
DefineTest("TestEvaluateStrings").func = function() {
  var model = interview.Parse("x = \"hello world\";");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], "hello world");

  model = interview.Parse("x = a\"hello to a world with a \"a\";");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], "hello to a world with a \"");

  model = interview.Parse("x = \"\";");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], "");

  model = interview.Parse("x = abc\"abc\";");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], "");

  model = interview.Parse("x = abc\"abcabc\";");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], "abc");

  model = interview.Parse("x = abc\"\"abc\";");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], "\"");
}
DefineTest("TestStringAddition").func = function() {
  var model = interview.Parse("x = \"hello \" + \"world\";");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], "hello world");

  model = interview.Parse("x = 12; y = x * x; z = x + \" squared = \" + y;");
  interview.RunModel(model);
  EXPECT_EQ(model.data["z"], "12 squared = 144");

  model = interview.Parse("x = \"hello\"; z = \"x=\" + x;");
  interview.RunModel(model);
  EXPECT_EQ(model.data["z"], "x=hello");

  model = interview.Parse("x = \"hello \" + 123 + \" there \"; x = x + x;");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], "hello 123 there hello 123 there ");

  model = interview.Parse("x = \"hello \" + 123 + 123;");
  interview.RunModel(model);
  EXPECT_EQ(model.data["x"], "hello 123123");
}
DefineTest("TestTokenizeKeywords").func = function() {
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

  str = "_id";
  EXPECT_EQ(str, interview.COPYID_KEYWORD);
  tokens = TokenizeForTest(str);
  EXPECT_EQ(tokens.length, 1);
  EXPECT_EQ(tokens[0][0], "_id");
  EXPECT_EQ(tokens[0][1], 0);
  EXPECT_EQ(tokens[0][2], 3);
  EXPECT_EQ("_id", str.substr(tokens[0][1], tokens[0][2]));
}
DefineTest("TestDefaultNavigation").func = function() {
  var model = interview.Parse(
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
  interview.RenderModel(model, form);
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
}
DefineTest("TestDeveloperMode").func = function() {
  var model = interview.Parse("");
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
  EXPECT_EQ(model.hasOwnProperty("RenderPrevPage"), false);
  EXPECT_EQ(model.hasOwnProperty("RenderNextPage"), false);
  EXPECT_EQ(model.hasOwnProperty("Reload"), false);
  interview.DeveloperMode(model);
  var text = model.dev_mode_textbox;
  EXPECT_SUBSTR(text, "model_def_");
  // Write a new model dynamically
  document.getElementById(text).value = "page a page b page c";
  model = interview.Reload(model);
  // The old model is dead. Long live the new model.
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
DefineTest("TestPrintWithData").func = function() {
  var str =   "form foo " +
    "page one " +
    "x = 1; " +
    "s = \"hello\";" +
    "z = \"x=\" + x;" +
    "z = z + \", s=\" + s;\n" +
    "print z\n";
  var model = interview.Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
  EXPECT_SUBSTR(form.innerHTML, "x=1, s=hello");
  // For manual testing, don't remove the form element.
  form.remove();
}
DefineTest("TestPageNavigation").func = function() {
  var model = interview.Parse(
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
  interview.RenderModel(model, form);
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
DefineTest("TestInputStatements").func = function() {
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
  var model = interview.Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
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
DefineTest("TestRenderingRunsTheTopCodeForAllPages").func = function() {
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
  var model = interview.Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
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
DefineTest("TestBasicFormsLowLevel").func = function() {
  var model = {};
  interview.InitForms(model);
  interview.SetForm(model, "US1040");
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormCopyId(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 1);
  interview.SetForm(model, "US_W2");
  EXPECT_EQ(model.curr_form, "US_W2");
  EXPECT_EQ(interview.GetFormCopyId(model), 0);
  interview.SetForm(model, "US1040");
  EXPECT_EQ(interview.GetNumFormCopies(model), 1);
  interview.SetForm(model, "US_W2");
  EXPECT_EQ(interview.GetNumFormCopies(model), 1);

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
DefineTest("TestMultipleCopiesOfFormsLowLevel").func = function() {
  var model = {};
  interview.InitForms(model);
  interview.SetForm(model, "US1040");
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormCopyId(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 1);
  interview.GetDataObj(model).line_1 = "First Copy";
  interview.NewFormCopy(model);
  EXPECT_EQ(interview.GetFormCopyId(model), 1);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  interview.GetDataObj(model).line_1 = "Second Copy";

  interview.IncrementFormCopy(model, -1);
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormCopyId(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "First Copy");

  interview.IncrementFormCopy(model, 0);
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormCopyId(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "First Copy");

  interview.IncrementFormCopy(model, 1);
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormCopyId(model), 1);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "Second Copy");

  // Go past the bounds
  interview.IncrementFormCopy(model, -2);
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormCopyId(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "First Copy");

  interview.IncrementFormCopy(model, 2);
  EXPECT_EQ(model.curr_form, "US1040");
  EXPECT_EQ(interview.GetFormCopyId(model), 1);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "Second Copy");
}
DefineTest("TestDeleteFormLowLevel").func = function() {
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

  interview.UseCopyId(model, 2);
  EXPECT_EQ(interview.GetFormCopyId(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 2");

  // Unit under test
  interview.DeleteFormCopy(model);

  EXPECT_EQ(interview.GetNumFormCopies(model), 3);
  EXPECT_EQ(interview.GetFormCopyId(model), 3);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 3");
  interview.UseCopyId(model, 1);
  EXPECT_EQ(interview.GetFormCopyId(model), 1);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 1");
}
DefineTest("TestDeleteLastFormLowLevel").func = function() {
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

  interview.UseCopyId(model, 3);
  EXPECT_EQ(interview.GetFormCopyId(model), 3);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 3");

  // unit under test
  interview.DeleteFormCopy(model);

  EXPECT_EQ(interview.GetNumFormCopies(model), 3);
  EXPECT_EQ(interview.GetFormCopyId(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 2");
  interview.IncrementFormCopy(model, 1);
  EXPECT_EQ(interview.GetFormCopyId(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 2");
}
DefineTest("TestDeleteFirstFormLowLevel").func = function() {
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

  interview.UseCopyId(model, 0);
  EXPECT_EQ(interview.GetFormCopyId(model), 0);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 0");

  // unit under test
  interview.DeleteFormCopy(model);

  EXPECT_EQ(interview.GetNumFormCopies(model), 3);
  EXPECT_EQ(interview.GetFormCopyId(model), 1);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 1");
  interview.IncrementFormCopy(model, -1);
  EXPECT_EQ(interview.GetFormCopyId(model), 1);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 1");
  interview.IncrementFormCopy(model, 1);
  EXPECT_EQ(interview.GetFormCopyId(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 2");
  interview.IncrementFormCopy(model, 1);
  EXPECT_EQ(interview.GetFormCopyId(model), 3);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 3");
  interview.IncrementFormCopy(model, 1);
  EXPECT_EQ(interview.GetFormCopyId(model), 3);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 3");
}
DefineTest("TestMultipleCopiesOfFormsComplexLowLevel").func = function() {
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
  EXPECT_EQ(interview.GetFormCopyId(model), 3);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 3");
  interview.UseCopyId(model, 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 2");
  interview.IncrementFormCopy(model, -2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 0");

  interview.SetForm(model, "US_W2");
  EXPECT_EQ(interview.GetFormCopyId(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US_W2 Copy 2");

  interview.SetForm(model, "US1040");
  EXPECT_EQ(interview.GetFormCopyId(model), 0);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 0");
  interview.NewFormCopy(model);
  EXPECT_EQ(interview.GetFormCopyId(model), 4);
  interview.DeleteFormCopy(model);
  EXPECT_EQ(interview.GetFormCopyId(model), 3);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US1040 Copy 3");

  interview.SetForm(model, "US_W2");
  EXPECT_EQ(interview.GetFormCopyId(model), 2);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US_W2 Copy 2");
  interview.DeleteFormCopy(model);
  EXPECT_EQ(interview.GetFormCopyId(model), 1);
  EXPECT_EQ(interview.GetDataObj(model).line_1, "US_W2 Copy 1");
}
DefineTest("TestBasicForms").func = function() {
  var str = "button init button a button b button c\n" +
    "line_1 = \"Current Form: scratch\";" +
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
  var model = interview.Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
  // There are 3 forms because there is also a default form named scratch.
  // I had to add a default form because otherwise too many unit tests
  // would break.
  EXPECT_EQ(Object.keys(model.form_info).length, 3);
  EXPECT_EQ(model.curr_form, "two");
  model.GoToPage("a");
  EXPECT_EQ(model.curr_form, "one");
  EXPECT_SUBSTR(form.innerHTML, "Current Form: one");
  model.GoToPage("b");
  EXPECT_EQ(model.curr_form, "two");
  EXPECT_SUBSTR(form.innerHTML, "Current Form: two");
  // This next part checks that the current form is set to scratch between pages.
  model.GoToPage("b");
  model.GoToPage("c");
  EXPECT_EQ(model.curr_form, "scratch");
  EXPECT_SUBSTR(form.innerHTML, "Current Form: scratch");
  model.GoToPage("a");
  model.GoToPage("c");
  EXPECT_EQ(model.curr_form, "scratch");
  EXPECT_SUBSTR(form.innerHTML, "Current Form: scratch");
  // For manual testing, don't remove the form element.
  form.remove();
}
DefineTest("TestGotoKeyword").func = function() {
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
  var model = interview.Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
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
DefineTest("TestGotoKeywordInHeader").func = function() {
  var str = "button a\n" +
    "goto b\n" +
    "page a\n" +
    "page b\n";
  try {
    var model = interview.Parse(str);
    FAIL("Should throw an error because of goto in header but didn't.");
  } catch(err) {
    EXPECT_EQ(err.msg, "Cannot use the goto keyword in the model header.");
    EXPECT_EQ(err.idx1, 9);
    EXPECT_EQ(err.idx2, 13);
    EXPECT_EQ(str.substr(9, 4), "goto");
  }
}
DefineTest("TestCreateMultipleCopiesOfForms").func = function() {
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
  var model = interview.Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
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
DefineTest("TestUseCopyKeyword").func = function() {
  var str = "form foo\n" +
    "\n" +
    "page make_copies\n" +
    "  x = \"copy = 0\";\n" +
    "  newcopy\n" +
    "  x = \"copy = 1\";\n" +
    "  newcopy\n" +
    "  x = \"copy = 2\";\n" +
    "  newcopy\n" +
    "  x = \"copy = 3\";\n" +
    "\n" +
    "page usecopy0\n" +
    "  usecopy 0\n" +
    "  print x\n" +
    "\n" +
    "page usecopy1\n" +
    "  usecopy 1\n" +
    "  print x\n" +
    "\n" +
    "page usecopy2\n" +
    "  usecopy 2\n" +
    "  print x\n" +
    "\n" +
    "page usecopy3\n" +
    "  usecopy 3\n" +
    "  print x\n" +
    "\n";
  var model = interview.Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
  EXPECT_SUBSTR(form.innerHTML, "Form: foo[3]");
  model.GoToPage("usecopy0");
  EXPECT_SUBSTR(form.innerHTML, "Form: foo[0]");
  EXPECT_SUBSTR(form.innerHTML, "copy = 0");
  model.GoToPage("usecopy2");
  EXPECT_SUBSTR(form.innerHTML, "Form: foo[2]");
  EXPECT_SUBSTR(form.innerHTML, "copy = 2");
  model.GoToPage("usecopy3");
  EXPECT_SUBSTR(form.innerHTML, "Form: foo[3]");
  EXPECT_SUBSTR(form.innerHTML, "copy = 3");
  model.GoToPage("usecopy1");
  EXPECT_SUBSTR(form.innerHTML, "Form: foo[1]");
  EXPECT_SUBSTR(form.innerHTML, "copy = 1");
  // For manual testing, don't remove the form element.
  form.remove();
}
DefineTest("TestZeroPrefix").func = function() {
  EXPECT_EQ(interview.ZeroPrefix(3), "03");
  EXPECT_EQ(interview.ZeroPrefix(3, 1), "3");
  EXPECT_EQ(interview.ZeroPrefix(3, 2), "03");
  EXPECT_EQ(interview.ZeroPrefix(3, 3), "003");
}
DefineTest("TestGetSavePageName").func = function() {
  var dt = new Date('December 17, 1995 03:24:00');
  var page_name = interview.GetSavePageName(dt);
  EXPECT_EQ(page_name, "Restore___1995_12_17___03_24_00");
}
DefineTest("TestFindFirstPage").func = function() {
  var model = interview.Parse(
      "form page_foo " +
      "form page_bar " +
      "/* page you_found_a_comment */ " +
      "print \" page you_found_a_print \" " +
      "z = \" page you_found_an_expression \"; " +
      "\" page you_found_a_string \"; " +
      "page start " +
      "print zzzz\"You found me!zzzz\" " +
      "page page2 " +
      "print zzzz\"meh.zzzz\" "
  );
  EXPECT_EQ(interview.FindFirstPage(model), "start");
}
DefineTest("TestGetTextIndexOfPage").func = function() {
  var model = interview.Parse(
      "form page_foo " +
      "form page_bar " +
      "/* page you_found_a_comment */ " +
      "print \" page you_found_a_print \" " +
      "z = \" page you_found_an_expression \"; " +
      "\" page you_found_a_string \"; " +
      "page start " +
      "\"You found me!zzzz\";" +
      "page page2 " +
      "\"meh.zzzz\";"
  );
  EXPECT_EQ(Object.keys(model.pages).length, 2);
  var idx = interview.GetTextIndexOfPage(model, "start");
  EXPECT_EQ(idx, 159);
  EXPECT_EQ(model.text.substr(idx, 21), "page start \"You found");
  idx = interview.GetTextIndexOfPage(model, "page2");
  EXPECT_EQ(idx, 190);
  EXPECT_EQ(model.text.substr(idx, 16), "page page2 \"meh.");
  idx = interview.GetTextIndexOfPage(model, "not_a_real_page");
  EXPECT_EQ(idx, model.text.length);
  EXPECT_EQ(idx, 212);
  idx = interview.GetTextIndexOfPage(model, undefined);
  EXPECT_EQ(idx, model.text.length);
  EXPECT_EQ(idx, 212);
  idx = interview.GetTextIndexOfPage(model, null);
  EXPECT_EQ(idx, model.text.length);
  EXPECT_EQ(idx, 212);
}
DefineTest("TestSaveState").func = function() {
  var original_model = "page p1 form foo usecopy 0 x = \"goodbye\";\n" +
                       "page p2 form foo newcopy usecopy 1 x = \"hello\";\n" +
                       "page stop form foo\n" +
                       "page p3 form foo usecopy 0 print x\n" +
                       "page p4 form foo usecopy 1 print x\n";
  var model = interview.Parse(original_model);
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
  EXPECT_EQ(interview.GetFormCopyId(model), 0)
  model.GoToPage("p2");
  EXPECT_EQ(interview.GetFormCopyId(model), 1)
  model.GoToPage("stop");
  EXPECT_EQ(interview.GetFormCopyId(model), 1)
  interview.DeveloperMode(model);
  model.dev_mode_start_time = new Date("2021-04-17T13:51:03");
  interview.SaveState(model);
  var text=document.getElementById(model.dev_mode_textbox).value;
  var expected_model_1 = 
     "page Restore___2021_04_17___13_51_03\n" +
     "  form foo\n" +
     "  internal_resetcopyid 0\n" +
     "  x = \"goodbye\";\n" +
     "  newcopy\n" +
     "  internal_resetcopyid 1\n" +
     "  x = \"hello\";\n" +
     "  usecopy 1 /* last_known_copy_id */\n" +
     "  form scratch\n" +
     "  internal_resetcopyid 0\n" +
     "  usecopy 0 /* last_known_copy_id */\n" +
     "  goto stop /* last_known_page */\n\n" +
     original_model;
  EXPECT_EQ(text, expected_model_1);
  interview.SaveState(model);
  interview.SaveState(model);
  EXPECT_EQ(text, expected_model_1);

  model = interview.Reload(model);
  model.GoToPage("p3");
  EXPECT_SUBSTR(form.innerHTML, "goodbye");
  model.GoToPage("p4");
  EXPECT_SUBSTR(form.innerHTML, "hello");
  interview.DeveloperMode(model);
  interview.SaveState(model);
  interview.SaveState(model);
  // For manual testing, don't remove the form element.
  form.remove();
}
DefineTest("TestResetFormCopyId").func = function() {
  var str = "page p1 form foo "+
                    "page p2 form foo internal_resetcopyid 5 " +
                    "page p3 form foo x = 3; internal_resetcopyid x " +
                    "page p4 form foo newcopy " +
                    "page p5 form foo prevcopy " +
                    "page p6 form foo nextcopy " +
                    "page p7 form bar internal_resetcopyid 7";
  var model = interview.Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
  // Just one form copy: 0
  EXPECT_EQ(interview.GetFormCopyId(model), 0);
  EXPECT_EQ(interview.GetNumFormCopies(model), 1);
  EXPECT_EQ(model.curr_form, "foo");
  model.GoToPage("p2");
  // Just one form copy: 5
  EXPECT_EQ(interview.GetFormCopyId(model), 5);
  EXPECT_EQ(interview.GetNextCopyId(model), 5);
  EXPECT_EQ(interview.GetPrevCopyId(model), 5);
  EXPECT_EQ(interview.GetNumFormCopies(model), 1);
  model.GoToPage("p4");
  // form copies: 5, 6
  EXPECT_EQ(interview.GetFormCopyId(model), 6);
  EXPECT_EQ(interview.GetNextCopyId(model), 6);
  EXPECT_EQ(interview.GetPrevCopyId(model), 5);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  model.GoToPage("p3");
  // form copies: 3, 5
  EXPECT_EQ(interview.GetFormCopyId(model), 3);
  EXPECT_EQ(interview.GetNextCopyId(model), 5);
  EXPECT_EQ(interview.GetPrevCopyId(model), 3);
  EXPECT_EQ(interview.GetNumFormCopies(model), 2);
  model.GoToPage("p4");
  // form copies: 3, 5, 7
  EXPECT_EQ(interview.GetFormCopyId(model), 7);
  EXPECT_EQ(interview.GetNextCopyId(model), 7);
  EXPECT_EQ(interview.GetPrevCopyId(model), 5);
  EXPECT_EQ(interview.GetNumFormCopies(model), 3);
  model.GoToPage("p5");
  // form copies: 3, 5(curr), 7
  EXPECT_EQ(interview.GetFormCopyId(model), 5);
  EXPECT_EQ(interview.GetNextCopyId(model), 7);
  EXPECT_EQ(interview.GetPrevCopyId(model), 3);
  model.GoToPage("p5");
  // form copies: 3(curr), 5, 7
  EXPECT_EQ(interview.GetFormCopyId(model), 3);
  EXPECT_EQ(interview.GetNextCopyId(model), 5);
  EXPECT_EQ(interview.GetPrevCopyId(model), 3);
  model.GoToPage("p5");
  // form copies: 3(curr), 5, 7
  EXPECT_EQ(interview.GetFormCopyId(model), 3);
  model.GoToPage("p6");
  // form copies: 3, 5(curr), 7
  EXPECT_EQ(interview.GetFormCopyId(model), 5);
  model.GoToPage("p6");
  // form copies: 3, 5, 7(curr)
  EXPECT_EQ(interview.GetFormCopyId(model), 7);
  model.GoToPage("p6");
  // form copies: 3, 5, 7(curr)
  EXPECT_EQ(interview.GetFormCopyId(model), 7);

  model.GoToPage("p7");
  EXPECT_EQ(model.curr_form, "bar");
  EXPECT_EQ(interview.GetFormCopyId(model), 7);
  EXPECT_EQ(interview.GetNumFormCopies(model), 1);

  interview.SetForm(model, "foo");
  EXPECT_EQ(interview.GetFormCopyId(model), 7);
  EXPECT_EQ(interview.GetNumFormCopies(model), 3);
  // For manual testing, don't remove the form element.
  form.remove();
}
DefineTest("TestExpressionsWith_id").func = function() {
  let str = "page p1 form foo " +
            "    z = \"[_id = \" + _id + \"]\"; print z " +
            "    z = \"[_id + 5 = \" + (_id + 5) + \"]\"; print z " +
            "    z = \"[_id - 5 = \" + (_id - 5) + \"]\"; print z " +
            "    z = \"[5 - _id = \" + (5 - _id) + \"]\"; print z " +
            "    z = \"[5 + _id = \" + (5 + _id) + \"]\"; print z " +
            "    z = \"[5 * _id = \" + (5 * _id) + \"]\"; print z " +
            "    z = \"[_id * 5 = \" + (_id * 5) + \"]\"; print z " +
            "    z = \"[_id / 5 = \" + (_id / 5) + \"]\"; print z " +
            "    z = \"[5 / _id = \" + (5 / _id) + \"]\"; print z ";
  var form = document.createElement("form");
  document.body.appendChild(form);
  var model = interview.RenderFromStr(str, form);
  model.GoToPage("p1");
  EXPECT_SUBSTR(form.innerHTML, "[_id = 0]");
  EXPECT_SUBSTR(form.innerHTML, "[_id + 5 = 5]");
  EXPECT_SUBSTR(form.innerHTML, "[_id - 5 = -5]");
  EXPECT_SUBSTR(form.innerHTML, "[5 - _id = 5]");
  EXPECT_SUBSTR(form.innerHTML, "[5 + _id = 5]");
  EXPECT_SUBSTR(form.innerHTML, "[5 * _id = 0]");
  EXPECT_SUBSTR(form.innerHTML, "[_id * 5 = 0]");
  EXPECT_SUBSTR(form.innerHTML, "[_id / 5 = 0]");
  EXPECT_SUBSTR(form.innerHTML, "[5 / _id = Infinity]");
  interview.ResetCopyId(model, null, 3)
  model.GoToPage("p1");
  EXPECT_SUBSTR(form.innerHTML, "[_id = 3]");
  EXPECT_SUBSTR(form.innerHTML, "[_id + 5 = 8]");
  EXPECT_SUBSTR(form.innerHTML, "[_id - 5 = -2]");
  EXPECT_SUBSTR(form.innerHTML, "[5 - _id = 2]");
  EXPECT_SUBSTR(form.innerHTML, "[5 + _id = 8]");
  EXPECT_SUBSTR(form.innerHTML, "[5 * _id = 15]");
  EXPECT_SUBSTR(form.innerHTML, "[_id * 5 = 15]");
  EXPECT_SUBSTR(form.innerHTML, "[_id / 5 = 0.6]");
  // This next line might be a bad test.
  EXPECT_SUBSTR(form.innerHTML, "[5 / _id = 1.6666666666666667]");
  interview.ResetCopyId(model, null, 15)
  model.GoToPage("p1");
  EXPECT_SUBSTR(form.innerHTML, "[_id = 15]");
  EXPECT_SUBSTR(form.innerHTML, "[_id / 5 = 3]");
  EXPECT_SUBSTR(form.innerHTML, "[5 / _id = 0.3333333333333333]");
  form.remove();
}
DefineTest("TestSelect").func = function() {
  var str = "page initialize\n" +
    "  form foo\n" +
    "  x = \"Hello A\";\n" +
    "  newcopy\n" +
    "  x = \"Hello B\";\n" +
    "  newcopy\n" +
    "  x = \"Hello C\";\n" +
    "  prevcopy\n" +
    "  goto main\n" +
    "\n" +
    "page up\n" +
    "  form foo\n" +
    "  prevcopy\n" +
    "  goto main\n" +
    "\n" +
    "page down\n" +
    "  form foo\n" +
    "  nextcopy\n" +
    "  goto main\n" +
    "\n" +
    "page main\n" +
    "  form foo\n" +
    "  select " +
    "      \"col 1\"," +
    "      \"[ _id = \" + _id + \" and x = \" + x + \"]\"," +
    "      3;" +
    "  button up\n" +
    "  button down\n" +
    "  z = \"current = \" + _id + \", \" + x;\n" +
    "  print z";
  var model = interview.Parse(str);
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
  EXPECT_SUBSTR(form.innerHTML, "col 1");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 0 and x = Hello A]");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 1 and x = Hello B]");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 2 and x = Hello C]");
  EXPECT_SUBSTR(form.innerHTML, "3");
  EXPECT_SUBSTR(form.innerHTML, "current = 1, Hello B");
  model.GoToPage("up");
  EXPECT_SUBSTR(form.innerHTML, "col 1");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 0 and x = Hello A]");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 1 and x = Hello B]");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 2 and x = Hello C]");
  EXPECT_SUBSTR(form.innerHTML, "3");
  EXPECT_SUBSTR(form.innerHTML, "current = 0, Hello A");
  model.GoToPage("up");
  EXPECT_SUBSTR(form.innerHTML, "col 1");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 0 and x = Hello A]");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 1 and x = Hello B]");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 2 and x = Hello C]");
  EXPECT_SUBSTR(form.innerHTML, "3");
  EXPECT_SUBSTR(form.innerHTML, "current = 0, Hello A");
  model.GoToPage("down");
  model.GoToPage("down");
  EXPECT_SUBSTR(form.innerHTML, "col 1");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 0 and x = Hello A]");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 1 and x = Hello B]");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 2 and x = Hello C]");
  EXPECT_SUBSTR(form.innerHTML, "3");
  EXPECT_SUBSTR(form.innerHTML, "current = 2, Hello C");
  model.GoToPage("down");
  EXPECT_SUBSTR(form.innerHTML, "col 1");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 0 and x = Hello A]");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 1 and x = Hello B]");
  EXPECT_SUBSTR(form.innerHTML, "[ _id = 2 and x = Hello C]");
  EXPECT_SUBSTR(form.innerHTML, "3");
  EXPECT_SUBSTR(form.innerHTML, "current = 2, Hello C");
  // For manual testing, don't remove the form element.
  form.remove();
}
DefineTest("TestRenderFromStr").func = function() {
  let form = document.createElement("form");
  document.body.appendChild(form);
  let str = "page A page B page C";
  let model = interview.RenderFromStr(str, form);
  EXPECT_SUBSTR(form.innerHTML, "Page: A");
  model.GoToPage("C");
  EXPECT_SUBSTR(form.innerHTML, "Page: C");
  model.GoToPage("B");
  EXPECT_SUBSTR(form.innerHTML, "Page: B");
  model.RenderPrevPage();
  EXPECT_SUBSTR(form.innerHTML, "Page: A");
  // For manual testing, don't remove the form element.
  form.remove();
}
DefineTest("TestRenderFromURL").func = function() {
  let test_name = AsyncTest();
  let onload = function(model) {
    current_test_name = test_name;
    EXPECT_SUBSTR(form.innerHTML, "Page: X");
    model.GoToPage("Z");
    EXPECT_SUBSTR(form.innerHTML, "Page: Z");
    model.GoToPage("Y");
    EXPECT_SUBSTR(form.innerHTML, "Page: Y");
    model.RenderPrevPage();
    EXPECT_SUBSTR(form.innerHTML, "Page: X");
    // For manual testing, don't remove the form element.
    form.remove();
    AsyncDone(test_name);
  }
  let form = document.createElement("form");
  document.body.appendChild(form);
  let model = interview.RenderFromURL("test_remote_model.interview", form, onload);
}
DefineTest("NotFoundInRenderFromURL").func = function() {
  let test_name = AsyncTest();
  let onLoad = function(model) {
    current_test_name = test_name;
    Fail("Should not call onLoad for a missing file.");
    AsyncDone(test_name);
  }
  let onFail = function(jsError) {
    current_test_name = test_name;
    EXPECT_EQ(jsError.message, "Failed to read url: [intentionally_not_found.interview]");
    // For manual testing, don't remove the form element.
    form.remove();
    AsyncDone(test_name);
  }
  let form = document.createElement("form");
  document.body.appendChild(form);
  let model = interview.RenderFromURL("intentionally_not_found.interview",
                                      form, onLoad, onFail);
}
DefineTest("TestRuntimeErrorPageNotFound").func = function() {
  // Create an interview and go to a non-existent page.
  // Verify it drops into developer mode and displays a descriptive error.
  let form = document.createElement("form");
  document.body.appendChild(form);
  let str = "page A page B page C";
  let model = interview.RenderFromStr(str, form);
  EXPECT_SUBSTR(form.innerHTML, "Page: A");
  model.GoToPage("D");
  EXPECT_SUBSTR(form.innerHTML, "No such page found: [D]. Check capitalization?");
  // For manual testing, don't remove the form element.
  form.remove();
}
DefineTest("CanRestartAfterError").func = function() {
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderFromStr("", form);
  // get the model from the form, like the run button does.
  model = form.model;
  // Introduce a runtime error
  interview.DeveloperMode(model);
  var textbox_id = model.dev_mode_textbox;
  EXPECT_SUBSTR(textbox_id, "model_def_");
  document.getElementById(textbox_id).value = "page bad goto p1";
  interview.Reload(model);
  EXPECT_SUBSTR(form.innerHTML, "No such page found: [p1]. Check capitalization?");
  // get the model from the form, like the run button does.
  model = form.model;
  EXPECT_EQ(model.hasOwnProperty("dev_mode_textbox"), true);
  textbox_id = model.dev_mode_textbox;
  EXPECT_SUBSTR(textbox_id, "model_def_");
  // Fix the error and run
  document.getElementById(textbox_id).value = "page ok";
  interview.Reload(model);
  EXPECT_SUBSTR(form.innerHTML, "Page: ok");
  // For manual testing, don't remove the form element.
  form.remove();
}
DefineTest("DisplayErrorsWithDefaultNavigation").func = function() {
  var model = interview.Parse("page a page b goto missing page c");
  var form = document.createElement("form");
  document.body.appendChild(form);
  interview.RenderModel(model, form);
  EXPECT_SUBSTR(form.innerHTML, "Page: a");
  model.RenderNextPage();
  EXPECT_SUBSTR(form.innerHTML, "No such page found: [missing]. Check capitalization?");

  model.GoToPage("c");
  EXPECT_SUBSTR(form.innerHTML, "Page: c");
  model.RenderPrevPage();
  EXPECT_SUBSTR(form.innerHTML, "No such page found: [missing]. Check capitalization?");

  model.GoToPage("a");
  EXPECT_SUBSTR(form.innerHTML, "Page: a");
  model.RenderNextPage();
  EXPECT_SUBSTR(form.innerHTML, "No such page found: [missing]. Check capitalization?");

  model.GoToPage("c");
  EXPECT_SUBSTR(form.innerHTML, "Page: c");
  // For manual testing, don't remove the form element.
  form.remove();
}
DefineTest("LoadModelKeepingSavedData").func = function() {
  let test_name = AsyncTest();
  let form = document.createElement("form");
  document.body.appendChild(form);
  let onload = function(model) {
    current_test_name = test_name;
    EXPECT_SUBSTR(form.innerHTML, "Page: X");
    // Save State to see the data that needs verification.
    interview.DeveloperMode(model);
    model.dev_mode_start_time = new Date("2021-04-17T13:51:03");
    interview.SaveState(model);
    var text=document.getElementById(model.dev_mode_textbox).value;
    var expected_model =
      `/* used in unit test to check if remote models can be loaded */
page Restore___2021_04_17___13_51_03
  form foo
  internal_resetcopyid 0
  x = 9;
  usecopy 0 /* last_known_copy_id */
  form scratch
  internal_resetcopyid 0
  x = 7;
  newcopy
  internal_resetcopyid 1
  x = 8;
  usecopy 1 /* last_known_copy_id */
  goto X /* last_known_page */

page X page Y page Z
`;
    EXPECT_EQ(text, expected_model);
    // For manual testing, don't remove the form element.
    form.remove();
    AsyncDone(test_name);
  }
  let model = interview.RenderFromStr(
      "page a x = 7; newcopy x=8; form foo x=9;" +
      " load \"test_remote_model.interview\"",
      form, onload);
}
DefineTest("LoadMissingFile").func = function() {
  let test_name = AsyncTest();
  let form = document.createElement("form");
  document.body.appendChild(form);
  let onDone = function(model) {
    current_test_name = test_name;
    EXPECT_SUBSTR(form.innerHTML,
                  "Failed to read url: [intentionally_not_found_2.interview]");
    EXPECT_SUBSTR(model.dev_mode_textbox, "model_def_");
    let text_box = document.getElementById(model.dev_mode_textbox);
    let idx1 = text_box.selectionStart;
    let idx2 = text_box.selectionEnd;
    EXPECT_EQ(text_box.value.substring(idx1, idx2), 
              "\"intentionally_not_found_2.interview\"");
    // For manual testing, don't remove the form element.
    form.remove();
    AsyncDone(test_name);
  }
  interview.RenderFromStr(
      "load \"intentionally_not_found_2.interview\"",
      form, onDone);
}
DefineTest("LoadFileWithParseError").func = function() {
  let test_name = AsyncTest();
  let form = document.createElement("form");
  document.body.appendChild(form);
  let onDone = function(model) {
    current_test_name = test_name;
    EXPECT_SUBSTR(form.innerHTML,
                  "Expected String or identifier after print");
    EXPECT_SUBSTR(model.dev_mode_textbox, "model_def_");
    let text_box = document.getElementById(model.dev_mode_textbox);
    let idx1 = text_box.selectionStart;
    let idx2 = text_box.selectionEnd;
    EXPECT_EQ(text_box.value.substring(idx1, idx2), 
              "print");
    EXPECT_SUBSTR(text_box.value, "This model is used in unit tests");
    EXPECT_SUBSTR(text_box.value, "print print");
    // For manual testing, don't remove the form element.
    form.remove();
    AsyncDone(test_name);
  }
  interview.RenderFromStr(
      "load \"intentional_parse_error.interview\"",
      form, onDone);
}
DefineTest("TestRenderFromStrWithParseError").func = function() {
  let form = document.createElement("form");
  document.body.appendChild(form);
  let str = "print print ;";
  let model = interview.RenderFromStr(str, form);
  EXPECT_SUBSTR(form.innerHTML, "Expected String or identifier after print");
  EXPECT_SUBSTR(model.dev_mode_textbox, "model_def_");
  let text_box = document.getElementById(model.dev_mode_textbox);
  let idx1 = text_box.selectionStart;
  let idx2 = text_box.selectionEnd;
  EXPECT_EQ(text_box.value.substring(idx1, idx2), "print");
  EXPECT_SUBSTR(text_box.value, "print print");
  // For manual testing, don't remove the form element.
  form.remove();
}
// RunTest("TestRenderFromStrWithParseError");
RunTestsRandomly();


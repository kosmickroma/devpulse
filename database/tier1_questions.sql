-- ============================================================================
-- PYTHON CODE QUEST - TIER 1: BEGINNER (100 Questions)
-- 5 Levels × 20 Questions = Progressive learning like Duolingo
-- ============================================================================

-- Clear existing Tier 1 questions
DELETE FROM code_quest_questions WHERE tier = 1;

-- ============================================================================
-- LEVEL 1: SUPER BASICS (20 questions)
-- Variables, Print, Numbers - Very repetitive to build confidence
-- ============================================================================

-- Questions 1-5: Basic print statements
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['print', 'basics'],
'print("Hello")',
'What does this code print?',
'{"A": "Hello", "B": "\"Hello\"", "C": "print", "D": "Error"}',
'A',
'The print() function outputs text. Quotation marks are not printed, just the text inside them.',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['print', 'numbers'],
'print(5)',
'What does this code print?',
'{"A": "5", "B": "print(5)", "C": "\"5\"", "D": "five"}',
'A',
'print() can display numbers directly. It prints the value: 5',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['print', 'basics'],
'print("Python")',
'What does this code print?',
'{"A": "Python", "B": "\"Python\"", "C": "python", "D": "PYTHON"}',
'A',
'Text inside quotation marks is printed exactly as written (case-sensitive).',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['print', 'numbers'],
'print(10)',
'What does this code print?',
'{"A": "10", "B": "ten", "C": "\"10\"", "D": "1 0"}',
'A',
'Numbers are printed as their numeric value: 10',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['print', 'basics'],
'print("Code")',
'What does this code print?',
'{"A": "Code", "B": "code", "C": "CODE", "D": "\"Code\""}',
'A',
'The text "Code" is printed exactly as written.',
30, 15);

-- Questions 6-10: Basic variables
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['variables', 'print'],
'x = 5
print(x)',
'What does this code print?',
'{"A": "5", "B": "x", "C": "x = 5", "D": "Error"}',
'A',
'Variables store values. x stores 5, so print(x) outputs 5.',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['variables', 'print'],
'name = "Alice"
print(name)',
'What does this code print?',
'{"A": "Alice", "B": "name", "C": "\"Alice\"", "D": "Error"}',
'A',
'The variable name stores "Alice", so print(name) outputs Alice.',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['variables', 'numbers'],
'age = 25
print(age)',
'What does this code print?',
'{"A": "25", "B": "age", "C": "twenty-five", "D": "Error"}',
'A',
'The variable age stores 25, so print(age) outputs the number 25.',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['variables', 'print'],
'city = "NYC"
print(city)',
'What does this code print?',
'{"A": "NYC", "B": "city", "C": "\"NYC\"", "D": "New York City"}',
'A',
'The variable city stores "NYC", which is exactly what gets printed.',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['variables', 'numbers'],
'score = 100
print(score)',
'What does this code print?',
'{"A": "100", "B": "score", "C": "Error", "D": "None"}',
'A',
'The variable score holds 100, so that value is printed.',
30, 15);

-- Questions 11-15: Simple math
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['operators', 'math'],
'print(5 + 3)',
'What does this code print?',
'{"A": "8", "B": "5 + 3", "C": "53", "D": "Error"}',
'A',
'Python evaluates 5 + 3 and prints the result: 8',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['operators', 'math'],
'print(10 - 2)',
'What does this code print?',
'{"A": "8", "B": "10 - 2", "C": "12", "D": "Error"}',
'A',
'Subtraction: 10 - 2 equals 8',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['operators', 'math'],
'print(4 * 2)',
'What does this code print?',
'{"A": "8", "B": "4 * 2", "C": "42", "D": "6"}',
'A',
'Multiplication: 4 × 2 = 8. The * symbol means multiply in Python.',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['operators', 'math'],
'print(20 / 5)',
'What does this code print?',
'{"A": "4.0", "B": "4", "C": "20 / 5", "D": "Error"}',
'A',
'Division: 20 ÷ 5 = 4.0 (Python division always returns a decimal)',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['operators', 'math'],
'print(7 + 1)',
'What does this code print?',
'{"A": "8", "B": "71", "C": "7 + 1", "D": "6"}',
'A',
'Addition: 7 + 1 equals 8',
30, 15);

-- Questions 16-20: Variables with math
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['variables', 'operators'],
'x = 5
y = 3
print(x + y)',
'What does this code print?',
'{"A": "8", "B": "x + y", "C": "53", "D": "Error"}',
'A',
'x is 5, y is 3, so x + y = 8',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['variables', 'operators'],
'a = 10
b = 2
print(a - b)',
'What does this code print?',
'{"A": "8", "B": "10 - 2", "C": "12", "D": "a - b"}',
'A',
'a is 10, b is 2, so 10 - 2 = 8',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['variables', 'operators'],
'num = 4
print(num * 2)',
'What does this code print?',
'{"A": "8", "B": "num * 2", "C": "42", "D": "6"}',
'A',
'num is 4, multiply by 2 gives us 8',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['variables', 'operators'],
'total = 16
print(total / 2)',
'What does this code print?',
'{"A": "8.0", "B": "8", "C": "total / 2", "D": "Error"}',
'A',
'total is 16, divided by 2 gives 8.0 (division returns a decimal)',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, 1, ARRAY['variables', 'operators'],
'n = 6
print(n + 2)',
'What does this code print?',
'{"A": "8", "B": "n + 2", "C": "62", "D": "4"}',
'A',
'n is 6, adding 2 gives us 8',
30, 15);

-- ============================================================================
-- LEVEL 2: STRINGS & CONCATENATION (20 questions)
-- Building on Level 1, introducing string operations
-- ============================================================================

-- Questions 1-5: String concatenation basics
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("Hello" + "World")',
'What does this code print?',
'{"A": "HelloWorld", "B": "Hello World", "C": "Hello + World", "D": "Error"}',
'A',
'The + operator joins strings together without spaces: HelloWorld',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("Hi" + " " + "there")',
'What does this code print?',
'{"A": "Hi there", "B": "Hithere", "C": "Hi + there", "D": "Error"}',
'A',
'Adding strings joins them. The middle " " adds a space: Hi there',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("Code" + "Quest")',
'What does this code print?',
'{"A": "CodeQuest", "B": "Code Quest", "C": "Code + Quest", "D": "Error"}',
'A',
'String concatenation joins without spaces: CodeQuest',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("Dev" + "Pulse")',
'What does this code print?',
'{"A": "DevPulse", "B": "Dev Pulse", "C": "DevandPulse", "D": "Error"}',
'A',
'Joining two strings: DevPulse',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("Good" + " " + "job")',
'What does this code print?',
'{"A": "Good job", "B": "Goodjob", "C": "Good + job", "D": "Error"}',
'A',
'Three strings joined: "Good" + space + "job" = Good job',
30, 15);

-- Questions 6-10: Variables with strings
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['variables', 'strings'],
'first = "Hello"
last = "World"
print(first + last)',
'What does this code print?',
'{"A": "HelloWorld", "B": "Hello World", "C": "first + last", "D": "Error"}',
'A',
'Variables hold "Hello" and "World", joining them gives: HelloWorld',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['variables', 'strings'],
'greeting = "Hi"
name = "Alice"
print(greeting + " " + name)',
'What does this code print?',
'{"A": "Hi Alice", "B": "HiAlice", "C": "greeting + name", "D": "Error"}',
'A',
'Joins "Hi" + space + "Alice" = Hi Alice',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['variables', 'strings'],
'word1 = "Python"
word2 = "Rocks"
print(word1 + word2)',
'What does this code print?',
'{"A": "PythonRocks", "B": "Python Rocks", "C": "word1 + word2", "D": "Error"}',
'A',
'Concatenating the two variables: PythonRocks',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['variables', 'strings'],
'a = "Code"
b = " "
c = "Quest"
print(a + b + c)',
'What does this code print?',
'{"A": "Code Quest", "B": "CodeQuest", "C": "Code  Quest", "D": "Error"}',
'A',
'Joins three strings: "Code" + " " + "Quest" = Code Quest',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['variables', 'strings'],
'city = "New"
print(city + "York")',
'What does this code print?',
'{"A": "NewYork", "B": "New York", "C": "city + York", "D": "Error"}',
'A',
'Variable "New" plus string "York": NewYork',
30, 15);

-- Questions 11-15: String repetition
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("Ha" * 3)',
'What does this code print?',
'{"A": "HaHaHa", "B": "Ha3", "C": "Ha Ha Ha", "D": "Error"}',
'A',
'The * operator repeats strings. "Ha" repeated 3 times: HaHaHa',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("Go" * 2)',
'What does this code print?',
'{"A": "GoGo", "B": "Go2", "C": "Go Go", "D": "Error"}',
'A',
'String repetition: "Go" times 2 = GoGo',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("!" * 4)',
'What does this code print?',
'{"A": "!!!!", "B": "!4", "C": "! ! ! !", "D": "Error"}',
'A',
'Repeating "!" four times: !!!!',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'word = "Na"
print(word * 3)',
'What does this code print?',
'{"A": "NaNaNa", "B": "Na3", "C": "Na Na Na", "D": "Error"}',
'A',
'Variable "Na" repeated 3 times: NaNaNa',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("-" * 5)',
'What does this code print?',
'{"A": "-----", "B": "-5", "C": "- - - - -", "D": "Error"}',
'A',
'Dash repeated 5 times: -----',
30, 15);

-- Questions 16-20: Mixed string operations
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("Hi" * 2 + "!")',
'What does this code print?',
'{"A": "HiHi!", "B": "Hi2!", "C": "HiHi !", "D": "Error"}',
'A',
'First "Hi" * 2 = "HiHi", then + "!" = HiHi!',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'msg = "Yay"
print(msg * 2)',
'What does this code print?',
'{"A": "YayYay", "B": "Yay2", "C": "Yay Yay", "D": "Error"}',
'A',
'Variable "Yay" repeated twice: YayYay',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("=" * 3 + "OK")',
'What does this code print?',
'{"A": "===OK", "B": "=3OK", "C": "= = =OK", "D": "Error"}',
'A',
'"=" repeated 3 times, then "OK": ===OK',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'a = "La"
print(a * 3 + " Land")',
'What does this code print?',
'{"A": "LaLaLa Land", "B": "La3 Land", "C": "LaLaLaLand", "D": "Error"}',
'A',
'"La" * 3 gives "LaLaLa", then + " Land": LaLaLa Land',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 2, ARRAY['strings', 'operators'],
'print("*" * 4 + " Done")',
'What does this code print?',
'{"A": "**** Done", "B": "*4 Done", "C": "****Done", "D": "Error"}',
'A',
'Four stars, then space and "Done": **** Done',
30, 15);

-- ============================================================================
-- LEVEL 3: LISTS & INDEXING (20 questions)
-- Building on variables and strings, introducing lists
-- ============================================================================

-- Questions 1-5: Basic list creation and printing
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'basics'],
'fruits = ["apple", "banana"]
print(fruits)',
'What does this code print?',
'{"A": "[''apple'', ''banana'']", "B": "apple banana", "C": "fruits", "D": "Error"}',
'A',
'Printing a list shows it with brackets and quotes: [''apple'', ''banana'']',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'basics'],
'numbers = [1, 2, 3]
print(numbers)',
'What does this code print?',
'{"A": "[1, 2, 3]", "B": "1 2 3", "C": "numbers", "D": "123"}',
'A',
'Printing a list shows brackets: [1, 2, 3]',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'basics'],
'colors = ["red", "blue"]
print(colors)',
'What does this code print?',
'{"A": "[''red'', ''blue'']", "B": "red blue", "C": "colors", "D": "Error"}',
'A',
'Lists are printed with brackets: [''red'', ''blue'']',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'basics'],
'scores = [10, 20]
print(scores)',
'What does this code print?',
'{"A": "[10, 20]", "B": "10 20", "C": "scores", "D": "1020"}',
'A',
'List with numbers: [10, 20]',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'basics'],
'items = ["pen", "paper", "book"]
print(items)',
'What does this code print?',
'{"A": "[''pen'', ''paper'', ''book'']", "B": "pen paper book", "C": "items", "D": "Error"}',
'A',
'Three items in a list: [''pen'', ''paper'', ''book'']',
30, 15);

-- Questions 6-10: List indexing basics (index 0)
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'fruits = ["apple", "banana", "cherry"]
print(fruits[0])',
'What does this code print?',
'{"A": "apple", "B": "banana", "C": "0", "D": "Error"}',
'A',
'Lists start at index 0. fruits[0] is the first item: apple',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'numbers = [10, 20, 30]
print(numbers[0])',
'What does this code print?',
'{"A": "10", "B": "0", "C": "20", "D": "Error"}',
'A',
'Index 0 is the first element: 10',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'colors = ["red", "green", "blue"]
print(colors[0])',
'What does this code print?',
'{"A": "red", "B": "green", "C": "blue", "D": "0"}',
'A',
'First item (index 0): red',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'names = ["Alice", "Bob", "Carol"]
print(names[0])',
'What does this code print?',
'{"A": "Alice", "B": "Bob", "C": "Carol", "D": "Error"}',
'A',
'Index 0 gets the first name: Alice',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'days = ["Mon", "Tue", "Wed"]
print(days[0])',
'What does this code print?',
'{"A": "Mon", "B": "Tue", "C": "Wed", "D": "0"}',
'A',
'First day (index 0): Mon',
30, 15);

-- Questions 11-15: Index 1 and 2
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'fruits = ["apple", "banana", "cherry"]
print(fruits[1])',
'What does this code print?',
'{"A": "banana", "B": "apple", "C": "cherry", "D": "1"}',
'A',
'Index 1 is the SECOND item: banana',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'numbers = [10, 20, 30]
print(numbers[2])',
'What does this code print?',
'{"A": "30", "B": "20", "C": "10", "D": "2"}',
'A',
'Index 2 is the THIRD item: 30',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'colors = ["red", "green", "blue"]
print(colors[1])',
'What does this code print?',
'{"A": "green", "B": "red", "C": "blue", "D": "1"}',
'A',
'Second item (index 1): green',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'names = ["Alice", "Bob", "Carol"]
print(names[2])',
'What does this code print?',
'{"A": "Carol", "B": "Bob", "C": "Alice", "D": "2"}',
'A',
'Third item (index 2): Carol',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'days = ["Mon", "Tue", "Wed"]
print(days[1])',
'What does this code print?',
'{"A": "Tue", "B": "Mon", "C": "Wed", "D": "1"}',
'A',
'Second day (index 1): Tue',
30, 15);

-- Questions 16-20: Length and indexing together
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'functions'],
'items = ["a", "b", "c"]
print(len(items))',
'What does this code print?',
'{"A": "3", "B": "[''a'', ''b'', ''c'']", "C": "abc", "D": "Error"}',
'A',
'len() returns the number of items in the list: 3',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'functions'],
'nums = [1, 2, 3, 4, 5]
print(len(nums))',
'What does this code print?',
'{"A": "5", "B": "12345", "C": "[1, 2, 3, 4, 5]", "D": "Error"}',
'A',
'The list has 5 items, so len() returns 5',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'data = [100, 200, 300]
print(data[1])',
'What does this code print?',
'{"A": "200", "B": "100", "C": "300", "D": "1"}',
'A',
'Index 1 is the second element: 200',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'operators'],
'list1 = [1, 2]
list2 = [3, 4]
print(list1 + list2)',
'What does this code print?',
'{"A": "[1, 2, 3, 4]", "B": "[1, 2] + [3, 4]", "C": "[4, 6]", "D": "Error"}',
'A',
'The + operator combines lists: [1, 2, 3, 4]',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, 3, ARRAY['lists', 'indexing'],
'letters = ["x", "y", "z"]
print(letters[2])',
'What does this code print?',
'{"A": "z", "B": "y", "C": "x", "D": "2"}',
'A',
'Index 2 is the third letter: z',
30, 15);

-- ============================================================================
-- LEVEL 4: CONDITIONALS (20 questions)
-- Building on all previous concepts, adding if/else logic
-- ============================================================================

-- Questions 1-5: Basic True/False
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['boolean', 'comparison'],
'print(5 > 3)',
'What does this code print?',
'{"A": "True", "B": "False", "C": "5 > 3", "D": "Error"}',
'A',
'5 is greater than 3, so the comparison is True',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['boolean', 'comparison'],
'print(2 < 1)',
'What does this code print?',
'{"A": "False", "B": "True", "C": "2 < 1", "D": "Error"}',
'A',
'2 is NOT less than 1, so this is False',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['boolean', 'comparison'],
'print(10 == 10)',
'What does this code print?',
'{"A": "True", "B": "False", "C": "10", "D": "Error"}',
'A',
'== checks equality. 10 equals 10, so True',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['boolean', 'comparison'],
'print(7 != 7)',
'What does this code print?',
'{"A": "False", "B": "True", "C": "7", "D": "Error"}',
'A',
'!= means "not equal". 7 IS equal to 7, so False',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['boolean', 'comparison'],
'print(8 >= 8)',
'What does this code print?',
'{"A": "True", "B": "False", "C": "8", "D": "Error"}',
'A',
'>= means greater than or equal. 8 equals 8, so True',
30, 15);

-- Questions 6-10: Simple if statements
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'if'],
'if 5 > 3:
    print("Yes")',
'What does this code print?',
'{"A": "Yes", "B": "Nothing", "C": "5 > 3", "D": "Error"}',
'A',
'5 > 3 is True, so the if block executes and prints Yes',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'if'],
'if 1 > 5:
    print("Yes")',
'What does this code print?',
'{"A": "Nothing", "B": "Yes", "C": "False", "D": "Error"}',
'A',
'1 > 5 is False, so the if block does NOT run. Nothing is printed.',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'if'],
'if 10 == 10:
    print("Equal")',
'What does this code print?',
'{"A": "Equal", "B": "Nothing", "C": "True", "D": "10"}',
'A',
'10 == 10 is True, so "Equal" is printed',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'if', 'variables'],
'x = 7
if x > 5:
    print("Big")',
'What does this code print?',
'{"A": "Big", "B": "Nothing", "C": "7", "D": "x"}',
'A',
'x is 7, which is > 5, so the condition is True and prints Big',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'if', 'variables'],
'age = 15
if age < 18:
    print("Kid")',
'What does this code print?',
'{"A": "Kid", "B": "Nothing", "C": "15", "D": "Adult"}',
'A',
'age is 15, which is < 18, so it prints Kid',
30, 15);

-- Questions 11-15: if-else statements
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'if', 'else'],
'if 5 > 10:
    print("Yes")
else:
    print("No")',
'What does this code print?',
'{"A": "No", "B": "Yes", "C": "Nothing", "D": "Error"}',
'A',
'5 > 10 is False, so the else block runs and prints No',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'if', 'else'],
'if 8 == 8:
    print("Same")
else:
    print("Different")',
'What does this code print?',
'{"A": "Same", "B": "Different", "C": "8", "D": "Error"}',
'A',
'8 == 8 is True, so the if block runs: Same',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'if', 'else', 'variables'],
'score = 85
if score >= 90:
    print("A")
else:
    print("B")',
'What does this code print?',
'{"A": "B", "B": "A", "C": "85", "D": "Error"}',
'A',
'score is 85, NOT >= 90, so else runs: B',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'if', 'else', 'variables'],
'num = 3
if num > 5:
    print("High")
else:
    print("Low")',
'What does this code print?',
'{"A": "Low", "B": "High", "C": "3", "D": "Error"}',
'A',
'num is 3, NOT > 5, so else executes: Low',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'if', 'else'],
'temp = 75
if temp > 80:
    print("Hot")
else:
    print("Cool")',
'What does this code print?',
'{"A": "Cool", "B": "Hot", "C": "75", "D": "Error"}',
'A',
'temp is 75, NOT > 80, so it prints Cool',
30, 15);

-- Questions 16-20: String and list conditions
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'strings'],
'name = "Bob"
if name == "Bob":
    print("Hi Bob")',
'What does this code print?',
'{"A": "Hi Bob", "B": "Nothing", "C": "Bob", "D": "Error"}',
'A',
'name equals "Bob", so the condition is True: Hi Bob',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'strings'],
'word = "cat"
if word != "dog":
    print("Not a dog")',
'What does this code print?',
'{"A": "Not a dog", "B": "Nothing", "C": "cat", "D": "dog"}',
'A',
'"cat" is NOT equal to "dog", so it prints Not a dog',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'lists'],
'items = [1, 2, 3]
if len(items) > 2:
    print("Many")',
'What does this code print?',
'{"A": "Many", "B": "Nothing", "C": "3", "D": "Error"}',
'A',
'len(items) is 3, which is > 2, so Many is printed',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'boolean'],
'ready = True
if ready:
    print("Go")',
'What does this code print?',
'{"A": "Go", "B": "Nothing", "C": "True", "D": "Error"}',
'A',
'ready is True, so the if condition passes: Go',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 4, ARRAY['conditionals', 'boolean'],
'done = False
if not done:
    print("Keep going")',
'What does this code print?',
'{"A": "Keep going", "B": "Nothing", "C": "False", "D": "Error"}',
'A',
'done is False, "not False" is True, so it prints Keep going',
30, 15);

-- ============================================================================
-- LEVEL 5: LOOPS (20 questions)
-- Final level in Tier 1, introducing for and while loops
-- ============================================================================

-- Questions 1-5: Basic range and for loops
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'range'],
'for i in range(3):
    print(i)',
'What does this code print?',
'{"A": "0\\n1\\n2", "B": "1\\n2\\n3", "C": "3", "D": "Error"}',
'A',
'range(3) gives 0, 1, 2. Each prints on a new line',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'range'],
'for i in range(2):
    print("Hi")',
'What does this code print?',
'{"A": "Hi\\nHi", "B": "Hi", "C": "HiHi", "D": "2"}',
'A',
'Loop runs 2 times, printing "Hi" each time on separate lines',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'range'],
'for num in range(1, 4):
    print(num)',
'What does this code print?',
'{"A": "1\\n2\\n3", "B": "0\\n1\\n2\\n3", "C": "1\\n2\\n3\\n4", "D": "Error"}',
'A',
'range(1, 4) starts at 1 and stops before 4: 1, 2, 3',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'range'],
'for x in range(5):
    print("*")',
'What does this code print?',
'{"A": "*\\n*\\n*\\n*\\n*", "B": "*****", "C": "5", "D": "*"}',
'A',
'Loop runs 5 times, printing a star each time on new lines',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('concept', 3, 1, 5, ARRAY['loops', 'range'],
NULL,
'How many times does range(4) loop?',
'{"A": "4 times", "B": "3 times", "C": "5 times", "D": "Forever"}',
'A',
'range(4) generates: 0, 1, 2, 3 (four numbers, so 4 iterations)',
30, 15);

-- Questions 6-10: Looping through lists
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'lists'],
'fruits = ["apple", "banana"]
for fruit in fruits:
    print(fruit)',
'What does this code print?',
'{"A": "apple\\nbanana", "B": "fruits", "C": "applebanana", "D": "Error"}',
'A',
'Loop goes through each item in the list, printing each one',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'lists'],
'nums = [5, 10, 15]
for n in nums:
    print(n)',
'What does this code print?',
'{"A": "5\\n10\\n15", "B": "51015", "C": "nums", "D": "Error"}',
'A',
'Each number in the list prints on its own line',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'strings'],
'for letter in "Hi":
    print(letter)',
'What does this code print?',
'{"A": "H\\ni", "B": "Hi", "C": "letter", "D": "Error"}',
'A',
'You can loop through strings! Each character prints separately: H, then i',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'lists'],
'colors = ["red", "blue"]
for c in colors:
    print(c)',
'What does this code print?',
'{"A": "red\\nblue", "B": "redblue", "C": "colors", "D": "c"}',
'A',
'Loops through the list, printing each color on a new line',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'lists', 'variables'],
'scores = [100, 200]
total = 0
for s in scores:
    total = total + s
print(total)',
'What does this code print?',
'{"A": "300", "B": "100200", "C": "0", "D": "Error"}',
'A',
'Loop adds each score to total: 0 + 100 + 200 = 300',
30, 20);

-- Questions 11-15: While loops
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'while'],
'count = 0
while count < 3:
    print(count)
    count = count + 1',
'What does this code print?',
'{"A": "0\\n1\\n2", "B": "1\\n2\\n3", "C": "0\\n1\\n2\\n3", "D": "Infinite loop"}',
'A',
'Starts at 0, prints and increments until count reaches 3',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'while'],
'n = 5
while n > 3:
    print(n)
    n = n - 1',
'What does this code print?',
'{"A": "5\\n4", "B": "5\\n4\\n3", "C": "5", "D": "Error"}',
'A',
'Starts at 5, prints, decrements. Stops when n becomes 3 (not > 3)',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'while'],
'x = 1
while x <= 2:
    print("Go")
    x = x + 1',
'What does this code print?',
'{"A": "Go\\nGo", "B": "Go", "C": "1\\n2", "D": "Infinite loop"}',
'A',
'Loop runs twice (x=1, then x=2), printing "Go" each time',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('concept', 3, 1, 5, ARRAY['loops', 'while'],
NULL,
'What happens if the while condition is always True?',
'{"A": "Infinite loop", "B": "Error", "C": "Runs once", "D": "Nothing"}',
'A',
'If the condition never becomes False, the loop runs forever (infinite loop)',
30, 15);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'while', 'boolean'],
'done = False
count = 0
while not done:
    count = count + 1
    if count >= 2:
        done = True
print(count)',
'What does this code print?',
'{"A": "2", "B": "1", "C": "3", "D": "Infinite loop"}',
'A',
'Loop runs until count reaches 2, then done becomes True and loop stops',
30, 20);

-- Questions 16-20: Loop patterns and break
INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'break'],
'for i in range(5):
    if i == 3:
        break
    print(i)',
'What does this code print?',
'{"A": "0\\n1\\n2", "B": "0\\n1\\n2\\n3", "C": "0\\n1\\n2\\n3\\n4", "D": "Error"}',
'A',
'break stops the loop when i equals 3. Prints 0, 1, 2 then exits',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'continue'],
'for i in range(4):
    if i == 2:
        continue
    print(i)',
'What does this code print?',
'{"A": "0\\n1\\n3", "B": "0\\n1\\n2\\n3", "C": "0\\n1", "D": "Error"}',
'A',
'continue skips the rest when i==2. Prints 0, 1, skips 2, prints 3',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'nested'],
'for i in range(2):
    for j in range(2):
        print(i, j)',
'What does this code print?',
'{"A": "0 0\\n0 1\\n1 0\\n1 1", "B": "0\\n1\\n2\\n3", "C": "00\\n01\\n10\\n11", "D": "Error"}',
'A',
'Nested loops: outer i goes 0,1, for each i inner j goes 0,1',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'lists', 'conditionals'],
'nums = [1, 2, 3, 4, 5]
for n in nums:
    if n % 2 == 0:
        print(n)',
'What does this code print?',
'{"A": "2\\n4", "B": "1\\n3\\n5", "C": "12345", "D": "Error"}',
'A',
'% gives remainder. Only prints even numbers (remainder 0 when divided by 2)',
30, 20);

INSERT INTO code_quest_questions (type, difficulty, tier, level, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, 5, ARRAY['loops', 'range', 'operators'],
'result = ""
for i in range(3):
    result = result + "X"
print(result)',
'What does this code print?',
'{"A": "XXX", "B": "X\\nX\\nX", "C": "3", "D": "Error"}',
'A',
'Each loop adds "X" to result string: "" → "X" → "XX" → "XXX"',
30, 20);

-- Complete! All 100 questions for Tier 1
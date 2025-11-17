-- ============================================================================
-- PYTHON CODE QUEST - Initial Question Set (30 questions)
-- Mix of all question types across Tier 1-2 difficulty
-- ============================================================================

-- Clear existing questions (for development)
-- TRUNCATE code_quest_questions;

-- TIER 1: INITIATE (Levels 1-5) - Python Fundamentals
-- ============================================================================

-- Question 1: Output Prediction - Basic Print
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 1, 1, ARRAY['variables', 'print'],
'x = 5
print(x)',
'What does this code print?',
'{"A": "x", "B": "5", "C": "Error", "D": "None"}',
'B',
'The variable x stores 5, and print(x) outputs the value stored in x, which is 5.',
50, 10);

-- Question 2: Output Prediction - String concatenation
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, ARRAY['strings', 'operators'],
'name = "Dev"
greeting = "Hello " + name
print(greeting)',
'What does this code print?',
'{"A": "Hello Dev", "B": "Hello + name", "C": "DevHello", "D": "Error"}',
'A',
'The + operator concatenates strings. "Hello " + "Dev" produces "Hello Dev".',
50, 12);

-- Question 3: Bug Hunt - Missing colon
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('bug', 2, 1, ARRAY['functions', 'syntax'],
'def greet(name)
    return f"Hello {name}"',
'What is wrong with this code?',
'{"A": "Missing colon after function definition", "B": "Wrong indentation", "C": "Invalid f-string", "D": "Nothing is wrong"}',
'A',
'Function definitions in Python must end with a colon (:). The correct syntax is: def greet(name):',
75, 15);

-- Question 4: Fill in the Blank - List indexing
INSERT INTO code_quest_questions (type, difficulty, tier, topics, question, options, correct, explanation, xp_base, time_limit) VALUES
('fill', 2, 1, ARRAY['lists', 'indexing'],
'To access the first element of a list called "items", you use: items[___]',
'{"A": "1", "B": "0", "C": "first", "D": "-1"}',
'B',
'Python uses zero-based indexing, so the first element is at index 0. items[-1] accesses the last element.',
50, 12);

-- Question 5: Output Prediction - Division
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 2, 1, ARRAY['operators', 'math'],
'x = 10
y = 3
print(x / y)',
'What does this code print?',
'{"A": "3", "B": "3.0", "C": "3.333...", "D": "Error"}',
'C',
'The / operator performs true division in Python 3, returning a float. 10/3 = 3.333... Use // for integer division.',
50, 12);

-- Question 6: Code Completion - If statement
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('complete', 2, 1, ARRAY['conditionals', 'comparison'],
'x = 10
_____:
    print("x is positive")',
'Which line correctly checks if x is positive?',
'{"A": "if x > 0", "B": "if (x > 0)", "C": "if x positive", "D": "while x > 0"}',
'A',
'The if statement checks conditions. Parentheses are optional in Python. "if x > 0:" is the Pythonic way.',
50, 15);

-- Question 7: Output Prediction - String repetition
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, ARRAY['strings', 'operators'],
'print("Hi" * 3)',
'What does this code print?',
'{"A": "Hi Hi Hi", "B": "HiHiHi", "C": "Hi3", "D": "Error"}',
'B',
'The * operator repeats strings. "Hi" * 3 produces "HiHiHi" (no spaces between).',
75, 10);

-- Question 8: Bug Hunt - Indentation
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('bug', 3, 1, ARRAY['loops', 'syntax'],
'for i in range(5):
print(i)',
'What is wrong with this code?',
'{"A": "Missing colon", "B": "Wrong indentation", "C": "Invalid range", "D": "Nothing is wrong"}',
'B',
'The print statement must be indented to be inside the for loop. Python uses indentation to define code blocks.',
75, 15);

-- Question 9: Output Prediction - List multiplication
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 3, 1, ARRAY['lists', 'operators'],
'x = [1, 2, 3]
print(x * 2)',
'What does this code print?',
'{"A": "[2, 4, 6]", "B": "[1, 2, 3, 1, 2, 3]", "C": "Error", "D": "[[1,2,3], [1,2,3]]"}',
'B',
'The * operator repeats lists. [1,2,3] * 2 creates [1,2,3,1,2,3]. To multiply elements, use a list comprehension.',
75, 15);

-- Question 10: Best Practice - Variable naming
INSERT INTO code_quest_questions (type, difficulty, tier, topics, question, options, correct, explanation, xp_base, time_limit) VALUES
('practice', 2, 1, ARRAY['best_practices', 'variables'],
'Which is the most Pythonic variable name for a user''s age?',
'{"A": "userAge", "B": "user_age", "C": "UserAge", "D": "USERAGE"}',
'B',
'Python convention (PEP 8) uses snake_case for variable names. user_age is the Pythonic choice.',
50, 15);

-- TIER 2: CODER (Levels 6-10) - Control Flow & Functions
-- ============================================================================

-- Question 11: Output Prediction - Boolean logic
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 4, 2, ARRAY['boolean', 'operators'],
'x = 5
y = 10
print(x > 3 and y < 15)',
'What does this code print?',
'{"A": "True", "B": "False", "C": "5", "D": "Error"}',
'A',
'Both conditions are true: 5 > 3 is True, and 10 < 15 is True. "and" returns True only if both are True.',
100, 12);

-- Question 12: Bug Hunt - Function return
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('bug', 4, 2, ARRAY['functions', 'return'],
'def double(x):
    x * 2

result = double(5)
print(result)',
'What is wrong with this code?',
'{"A": "Missing return statement", "B": "Wrong indentation", "C": "Invalid multiplication", "D": "Nothing is wrong"}',
'A',
'The function calculates x * 2 but doesn''t return it. Add "return x * 2" to fix. Without return, the function returns None.',
100, 15);

-- Question 13: Fill in the Blank - For loop with range
INSERT INTO code_quest_questions (type, difficulty, tier, topics, question, options, correct, explanation, xp_base, time_limit) VALUES
('fill', 4, 2, ARRAY['loops', 'range'],
'To loop from 0 to 9, you use: for i in _____:',
'{"A": "range(10)", "B": "range(0, 10)", "C": "range(9)", "D": "Both A and B"}',
'D',
'Both range(10) and range(0, 10) produce 0-9. range(10) defaults to starting at 0. range(9) would give 0-8.',
100, 15);

-- Question 14: Output Prediction - List append
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 5, 2, ARRAY['lists', 'methods'],
'nums = [1, 2]
nums.append(3)
print(nums)',
'What does this code print?',
'{"A": "[1, 2]", "B": "[1, 2, 3]", "C": "[3, 1, 2]", "D": "Error"}',
'B',
'append() adds an element to the end of a list. nums becomes [1, 2, 3].',
100, 12);

-- Question 15: Code Completion - While loop
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('complete', 5, 2, ARRAY['loops', 'while'],
'count = 0
_____:
    count += 1
    if count == 5:
        break',
'Which line creates an infinite loop that breaks at 5?',
'{"A": "while True", "B": "while count < 5", "C": "for count in range(5)", "D": "while count"}',
'A',
'"while True" creates an infinite loop. The break statement exits when count reaches 5.',
100, 15);

-- Question 16: Output Prediction - String methods
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 5, 2, ARRAY['strings', 'methods'],
'text = "python"
print(text.upper())',
'What does this code print?',
'{"A": "python", "B": "PYTHON", "C": "Python", "D": "Error"}',
'B',
'The .upper() method converts all characters to uppercase. "python" becomes "PYTHON".',
100, 10);

-- Question 17: Bug Hunt - Dictionary access
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('bug', 6, 2, ARRAY['dictionaries', 'errors'],
'data = {"name": "Alice", "age": 25}
print(data["email"])',
'What happens when this code runs?',
'{"A": "Prints None", "B": "Prints empty string", "C": "KeyError", "D": "Prints email"}',
'C',
'Accessing a non-existent key raises KeyError. Use data.get("email") to return None instead of erroring.',
125, 15);

-- Question 18: Output Prediction - List slicing
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 6, 2, ARRAY['lists', 'slicing'],
'nums = [0, 1, 2, 3, 4]
print(nums[1:4])',
'What does this code print?',
'{"A": "[1, 2, 3]", "B": "[1, 2, 3, 4]", "C": "[0, 1, 2, 3]", "D": "[2, 3, 4]"}',
'A',
'Slicing [1:4] gets elements from index 1 up to (but not including) index 4. Result: [1, 2, 3].',
125, 15);

-- Question 19: Fill in the Blank - Dictionary creation
INSERT INTO code_quest_questions (type, difficulty, tier, topics, question, options, correct, explanation, xp_base, time_limit) VALUES
('fill', 5, 2, ARRAY['dictionaries', 'syntax'],
'To create a dictionary with key "name" and value "Bob", you use: person = _____ "name": "Bob" _____',
'{"A": "[ ]", "B": "( )", "C": "{ }", "D": "< >"}',
'C',
'Dictionaries use curly braces: {"name": "Bob"}. Lists use [], tuples use ().',
100, 12);

-- Question 20: Best Practice - Function naming
INSERT INTO code_quest_questions (type, difficulty, tier, topics, question, options, correct, explanation, xp_base, time_limit) VALUES
('practice', 5, 2, ARRAY['best_practices', 'functions'],
'Which is the most Pythonic function name to calculate total price?',
'{"A": "calcTotalPrice", "B": "calculate_total_price", "C": "CalculateTotalPrice", "D": "CALCULATE_TOTAL_PRICE"}',
'B',
'Python convention (PEP 8) uses snake_case for function names. calculate_total_price is Pythonic.',
100, 15);

-- Question 21: Output Prediction - len() function
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 4, 2, ARRAY['functions', 'strings'],
'text = "Hello"
print(len(text))',
'What does this code print?',
'{"A": "Hello", "B": "5", "C": "4", "D": "Error"}',
'B',
'len() returns the number of characters in a string. "Hello" has 5 characters.',
100, 10);

-- Question 22: Bug Hunt - == vs =
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('bug', 5, 2, ARRAY['operators', 'common_mistakes'],
'x = 5
if x = 5:
    print("Five")',
'What is wrong with this code?',
'{"A": "Should use == for comparison", "B": "Missing colon", "C": "Wrong indentation", "D": "Nothing is wrong"}',
'A',
'Use = for assignment and == for comparison. The if statement should be "if x == 5:"',
100, 15);

-- Question 23: Output Prediction - Boolean values
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 5, 2, ARRAY['boolean', 'type_conversion'],
'print(bool(0))',
'What does this code print?',
'{"A": "True", "B": "False", "C": "0", "D": "Error"}',
'B',
'In Python, 0 is falsy. bool(0) returns False. Non-zero numbers return True.',
100, 10);

-- Question 24: Fill in the Blank - List comprehension
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('fill', 6, 2, ARRAY['list_comprehension', 'loops'],
'numbers = [1, 2, 3, 4]
doubled = [x _____ 2 for x in numbers]
# Result should be [2, 4, 6, 8]',
'Which operator goes in the blank?',
'{"A": "+", "B": "*", "C": "**", "D": "/"}',
'B',
'The * operator multiplies. [x * 2 for x in numbers] creates [2, 4, 6, 8].',
125, 15);

-- Question 25: Output Prediction - in operator
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 5, 2, ARRAY['operators', 'lists'],
'fruits = ["apple", "banana"]
print("apple" in fruits)',
'What does this code print?',
'{"A": "apple", "B": "True", "C": "False", "D": "1"}',
'B',
'The "in" operator checks membership. "apple" is in the list, so it returns True.',
100, 12);

-- Question 26: Code Completion - Default parameter
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('complete', 6, 2, ARRAY['functions', 'parameters'],
'def greet(name, greeting_____):
    print(f"{greeting} {name}")',
'Which syntax correctly sets "Hello" as the default greeting?',
'{"A": "= \"Hello\"", "B": ": \"Hello\"", "C": "== \"Hello\"", "D": "-> \"Hello\""}',
'A',
'Default parameters use =. The syntax is: def greet(name, greeting="Hello"):',
125, 15);

-- Question 27: Output Prediction - Negative indexing
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 6, 2, ARRAY['lists', 'indexing'],
'items = ["a", "b", "c", "d"]
print(items[-1])',
'What does this code print?',
'{"A": "a", "B": "d", "C": "-1", "D": "Error"}',
'B',
'Negative indexing counts from the end. items[-1] is the last element: "d".',
125, 12);

-- Question 28: Bug Hunt - String concatenation with int
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('bug', 6, 2, ARRAY['strings', 'type_errors'],
'age = 25
print("Age: " + age)',
'What is wrong with this code?',
'{"A": "Cannot concatenate string and int", "B": "Missing colon", "C": "Wrong quotes", "D": "Nothing is wrong"}',
'A',
'Cannot concatenate string and int directly. Use str(age) or f-string: f"Age: {age}"',
125, 15);

-- Question 29: Output Prediction - range function
INSERT INTO code_quest_questions (type, difficulty, tier, topics, code, question, options, correct, explanation, xp_base, time_limit) VALUES
('output', 5, 2, ARRAY['functions', 'range'],
'print(list(range(2, 8, 2)))',
'What does this code print?',
'{"A": "[2, 4, 6]", "B": "[2, 4, 6, 8]", "C": "[0, 2, 4, 6]", "D": "[2, 3, 4, 5, 6, 7]"}',
'A',
'range(2, 8, 2) starts at 2, stops before 8, steps by 2: [2, 4, 6].',
100, 15);

-- Question 30: Best Practice - String formatting
INSERT INTO code_quest_questions (type, difficulty, tier, topics, question, options, correct, explanation, xp_base, time_limit) VALUES
('practice', 6, 2, ARRAY['best_practices', 'strings'],
'Which is the most modern Pythonic way to format strings?',
'{"A": "\"Hello \" + name", "B": "\"Hello %s\" % name", "C": "\"Hello {}\".format(name)", "D": "f\"Hello {name}\""}',
'D',
'F-strings (f"Hello {name}") are the modern, Pythonic way introduced in Python 3.6. They are fast and readable.',
125, 15);

-- ============================================================================
-- INITIAL QUESTION SET LOADED!
-- ============================================================================
-- 30 questions across Tier 1-2 covering:
-- - Output Prediction (40%)
-- - Bug Hunt (25%)
-- - Fill in the Blank (20%)
-- - Code Completion (10%)
-- - Best Practice (5%)
-- ============================================================================

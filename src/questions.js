export const CONCEPTS = [
  { id: 'print', name: 'print()' },
  { id: 'variables', name: 'Variables' },
  { id: 'strings', name: 'Strings' },
  { id: 'numbers', name: 'Numbers' },
  { id: 'input', name: 'input()' },
  { id: 'comparisons', name: 'Comparisons' },
  { id: 'if', name: 'if / elif / else' },
  { id: 'lists', name: 'Lists' },
  { id: 'loops', name: 'Loops' },
  { id: 'functions', name: 'Functions' }
];

// tier 1 = remember, tier 2 = use it, tier 3 = manipulate/write it.
export const QUESTIONS = [
  { id:'p1', concept:'print', tier:1, prompt:'What would you write to show the word “Hello”?', type:'typed', answer:'print("Hello")', accepts:['print("Hello")',"print('Hello')"], explain:'print() displays the value inside its parentheses.' },
  { id:'p2', concept:'print', tier:2, prompt:'Change this so it displays “HUD ready”.', code:'print("Ready")', type:'typed', answer:'print("HUD ready")', accepts:['print("HUD ready")',"print('HUD ready')"], explain:'Replace the string passed to print().' },
  { id:'p3', concept:'print', tier:3, prompt:'Write one line that displays Speed: 45', type:'typed', answer:'print("Speed: 45")', accepts:['print("Speed: 45")',"print('Speed: 45')"], explain:'Pass the full text to print().' },

  { id:'v1', concept:'variables', tier:1, prompt:'Which line stores 35 in a variable called speed?', type:'choice', options:['speed == 35','speed = 35','35 = speed','print(speed)'], answer:'speed = 35', explain:'A single = assigns a value to a variable.' },
  { id:'v2', concept:'variables', tier:2, prompt:'What is speed after this code runs?', code:'speed = 30\nspeed = 42', type:'choice', options:['30','42','72','Error'], answer:'42', explain:'The second assignment replaces the first value.' },
  { id:'v3', concept:'variables', tier:3, prompt:'Start speed at 40, then increase it by 5. Write both lines.', type:'typed', answer:'speed = 40\nspeed += 5', accepts:['speed = 40\nspeed += 5','speed=40\nspeed+=5','speed = 40\nspeed = speed + 5','speed=40\nspeed=speed+5'], explain:'Assign the starting value, then update the same variable.' },

  { id:'s1', concept:'strings', tier:1, prompt:'Which one is a Python string?', type:'choice', options:['55','"55"','True','55.0'], answer:'"55"', explain:'Text inside quotes is a string.' },
  { id:'s2', concept:'strings', tier:2, prompt:'What does this display?', code:'road = "Main"\nprint(road + " St")', type:'choice', options:['road St','Main St','Main + St','Error'], answer:'Main St', explain:'The + joins the two strings.' },
  { id:'s3', concept:'strings', tier:3, prompt:'Use an f-string to display “Speed: 47” using speed.', code:'speed = 47', type:'typed', answer:'print(f"Speed: {speed}")', accepts:['print(f"Speed: {speed}")',"print(f'Speed: {speed}')"], explain:'An f-string inserts values inside braces.' },

  { id:'n1', concept:'numbers', tier:1, prompt:'What is 10 + 5 * 2 in Python?', type:'choice', options:['30','20','25','15'], answer:'20', explain:'Multiplication happens before addition.' },
  { id:'n2', concept:'numbers', tier:2, prompt:'Convert the text “55” to an integer and store it in speed.', type:'typed', answer:'speed = int("55")', accepts:['speed = int("55")','speed=int("55")',"speed = int('55')","speed=int('55')"], explain:'int() converts numeric text into an integer.' },
  { id:'n3', concept:'numbers', tier:3, prompt:'Convert 60 mph to km/h using 1.609 and store it in kph.', type:'typed', answer:'kph = 60 * 1.609', accepts:['kph = 60 * 1.609','kph=60*1.609'], explain:'Multiply mph by 1.609.' },

  { id:'i1', concept:'input', tier:1, prompt:'What data type does input() return before you convert it?', type:'choice', options:['String','Integer','Float','Boolean'], answer:'String', explain:'input() returns text.' },
  { id:'i2', concept:'input', tier:2, prompt:'Ask the user for their speed and store it in speed.', type:'typed', answer:'speed = input("Speed: ")', accepts:['speed = input("Speed: ")','speed=input("Speed: ")',"speed = input('Speed: ')","speed=input('Speed: ')"], explain:'input() returns what the user types.' },
  { id:'i3', concept:'input', tier:3, prompt:'Ask for speed and immediately convert the answer to an integer.', type:'typed', answer:'speed = int(input("Speed: "))', accepts:['speed = int(input("Speed: "))','speed=int(input("Speed: "))',"speed = int(input('Speed: '))","speed=int(input('Speed: '))"], explain:'Wrap input() with int() when you need a whole number.' },

  { id:'c1', concept:'comparisons', tier:1, prompt:'Which operator means “is equal to?”', type:'choice', options:['=','==','!=','>='], answer:'==', explain:'== compares values; = assigns.' },
  { id:'c2', concept:'comparisons', tier:2, prompt:'What does this evaluate to?', code:'speed = 60\nspeed > 55', type:'choice', options:['True','False','60','Error'], answer:'True', explain:'60 is greater than 55.' },
  { id:'c3', concept:'comparisons', tier:3, prompt:'Write a comparison that is True when speed is at least 55.', type:'typed', answer:'speed >= 55', accepts:['speed >= 55','speed>=55'], explain:'“At least” means greater than or equal to.' },

  { id:'if1', concept:'if', tier:1, prompt:'What prints?', code:'speed = 60\nif speed > 55:\n    print("Slow down")', type:'choice', options:['Nothing','Slow down','60','Error'], answer:'Slow down', explain:'The condition is True, so the indented line runs.' },
  { id:'if2', concept:'if', tier:2, prompt:'What prints?', code:'speed = 45\nif speed > 55:\n    print("Fast")\nelse:\n    print("Okay")', type:'choice', options:['Fast','Okay','45','Nothing'], answer:'Okay', explain:'The if condition is False, so else runs.' },
  { id:'if3', concept:'if', tier:3, prompt:'Fill in the condition so the warning appears at 56 mph or higher.', code:'speed = 60\nif _____:\n    print("Warning")', type:'typed', answer:'speed >= 56', accepts:['speed >= 56','speed>=56'], explain:'Use >= when the threshold itself should count.' },

  { id:'l1', concept:'lists', tier:1, prompt:'Which one is a list?', type:'choice', options:['"30, 40, 50"','[30, 40, 50]','(30, 40, 50)','{30: 40}'], answer:'[30, 40, 50]', explain:'Lists use square brackets.' },
  { id:'l2', concept:'lists', tier:2, prompt:'What does this display?', code:'speeds = [30, 40, 50]\nprint(speeds[1])', type:'choice', options:['30','40','50','Error'], answer:'40', explain:'List indexes start at 0.' },
  { id:'l3', concept:'lists', tier:3, prompt:'Add 60 to the end of this list.', code:'speeds = [30, 40, 50]', type:'typed', answer:'speeds.append(60)', accepts:['speeds.append(60)'], explain:'append() adds one item to a list.' },

  { id:'loop1', concept:'loops', tier:1, prompt:'How many times does this print?', code:'for x in [1, 2, 3]:\n    print(x)', type:'choice', options:['1','2','3','Forever'], answer:'3', explain:'The loop runs once for each item.' },
  { id:'loop2', concept:'loops', tier:2, prompt:'What is total after this runs?', code:'total = 0\nfor n in [2, 3]:\n    total += n', type:'choice', options:['0','2','3','5'], answer:'5', explain:'Both values are added to total.' },
  { id:'loop3', concept:'loops', tier:3, prompt:'Write a loop that prints every value in speeds.', code:'speeds = [30, 40, 50]', type:'typed', answer:'for speed in speeds:\n    print(speed)', accepts:['for speed in speeds:\n    print(speed)','for speed in speeds:\nprint(speed)'], explain:'A for loop visits each item.' },

  { id:'f1', concept:'functions', tier:1, prompt:'Which keyword starts a function definition?', type:'choice', options:['func','function','def','return'], answer:'def', explain:'Python uses def.' },
  { id:'f2', concept:'functions', tier:2, prompt:'What does this display?', code:'def show_speed(speed):\n    print(speed)\n\nshow_speed(45)', type:'choice', options:['speed','45','Nothing','Error'], answer:'45', explain:'45 is passed into the speed parameter.' },
  { id:'f3', concept:'functions', tier:3, prompt:'Write a function is_speeding(speed) that returns True above 55.', type:'typed', answer:'def is_speeding(speed):\n    return speed > 55', accepts:['def is_speeding(speed):\n    return speed > 55','def is_speeding(speed):\nreturn speed > 55'], explain:'Return the result of the comparison.' }
];

export function questionById(id) {
  return QUESTIONS.find(q => q.id === id) || null;
}

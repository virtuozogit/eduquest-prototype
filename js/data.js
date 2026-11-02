/* =====================================================================
   data.js — ALL editable content for the EduQuest prototype
   ---------------------------------------------------------------------
   - Grade 4 sample content for Mathematics, Science, and English.
   - Each quest has a "competency": what the student should learn,
     written in the style of the MATATAG curriculum (sample content).
   - Each quest has a short lesson and 9 questions (3 easy, 3 medium,
     3 hard). A challenge picks 6 of them (see Adaptive in quiz.js).
   - To add a question, copy a Q(...) line and change the text.
     Q(difficulty, question, [4 choices], index of correct choice (0-3), explanation)
   ===================================================================== */

// Small helper so each question fits on a few readable lines.
function Q(difficulty, question, choices, answer, explain) {
  return { difficulty, question, choices, answer, explain };
}

const EQ_DATA = {
  grade: 4,
  className: 'Grade 4 – Sampaguita',
  teacherName: 'Teacher Lea',

  subjects: [
    /* ------------------------------------------------------------- */
    {
      id: 'math',
      name: 'Mathematics',
      icon: 'calculator',
      emoji: '🔢',
      color: '#2563EB',
      light: '#DBEAFE',
      tagline: 'Numbers, shapes, and puzzles',
      quests: [
        {
          id: 'math-1',
          title: 'Place Value Peaks',
          short: 'Place Value',
          competency: 'Reads, writes, and identifies the place value of digits in numbers up to 100,000.',
          lesson: [
            'Every digit in a number has a <b>place</b>. Its place tells us how much it is worth.',
            'In <b>45,278</b>: 4 is in the ten thousands place (40,000), 5 is in the thousands (5,000), 2 is in the hundreds (200), 7 is in the tens (70), and 8 is in the ones (8).',
            '<b>Expanded form</b> shows each value: 40,000 + 5,000 + 200 + 70 + 8.',
            'Tip: read big numbers in groups. 45,278 → “forty-five thousand, two hundred seventy-eight.”'
          ],
          questions: [
            Q('easy', 'What is the place of the digit 7 in 37,152?', ['Ones', 'Tens', 'Thousands', 'Ten thousands'], 2, 'In 37,152 the 7 is in the thousands place, so its value is 7,000.'),
            Q('easy', 'Which number is “twelve thousand, four hundred five”?', ['12,405', '12,450', '1,245', '120,405'], 0, 'Twelve thousand = 12,000 and four hundred five = 405, so 12,000 + 405 = 12,405.'),
            Q('easy', 'What is the value of the digit 6 in 46,210?', ['6', '600', '6,000', '60,000'], 2, 'The 6 is in the thousands place, so it is worth 6,000.'),
            Q('medium', 'Write 30,000 + 2,000 + 500 + 9 in standard form.', ['32,509', '32,590', '3,259', '302,509'], 0, 'Put each value in its place: 3 ten thousands, 2 thousands, 5 hundreds, 0 tens, 9 ones = 32,509.'),
            Q('medium', 'Which digit is in the hundreds place of 58,364?', ['5', '8', '3', '6'], 2, 'Counting from the right: 4 is ones, 6 is tens, 3 is hundreds.'),
            Q('medium', 'Round 7,486 to the nearest hundred.', ['7,400', '7,500', '7,000', '7,490'], 1, 'Look at the tens digit (8). Since 8 is 5 or more, round up to 7,500.'),
            Q('hard', 'Which number has a 9 in the ten thousands place AND a 0 in the tens place?', ['19,005', '90,150', '90,105', '9,010'], 2, '90,105 has 9 ten thousands and 0 tens. 90,150 has 5 tens, so it does not fit.'),
            Q('hard', 'Using 3, 8, 1, 6, and 0 once each, what is the GREATEST 5-digit number?', ['80,136', '86,310', '86,301', '68,310'], 1, 'Put the biggest digits in the biggest places: 8, 6, 3, 1, 0 → 86,310.'),
            Q('hard', 'Rosa’s school collected 24,650 bottles. Ben’s school collected 4,000 more. How many did Ben’s school collect?', ['24,690', '64,650', '25,050', '28,650'], 3, 'Adding 4,000 changes the thousands digit: 24,650 + 4,000 = 28,650.')
          ]
        },
        {
          id: 'math-2',
          title: 'Multiplication Mountain',
          short: 'Multiply',
          competency: 'Multiplies 2- to 3-digit numbers by 1- to 2-digit numbers with and without regrouping.',
          lesson: [
            'Multiplication is fast adding: <b>4 × 23</b> means 23 + 23 + 23 + 23.',
            'Multiply the <b>ones</b> first, then the <b>tens</b>, then the <b>hundreds</b>. Carry (regroup) when a product is 10 or more.',
            'Example: 23 × 4 → 3 × 4 = 12, write 2 and carry 1. Then 2 × 4 = 8, plus the 1 you carried = 9. Answer: <b>92</b>.',
            'Tip: check by estimating. 23 is about 20, and 20 × 4 = 80, so 92 makes sense!'
          ],
          questions: [
            Q('easy', 'What is 6 × 7?', ['36', '42', '48', '13'], 1, '6 groups of 7 is 42. (13 is what you get if you add instead!)'),
            Q('easy', 'What is 21 × 3?', ['63', '24', '61', '73'], 0, '1 × 3 = 3 and 20 × 3 = 60, so 60 + 3 = 63.'),
            Q('easy', 'Which is the same as 4 × 15?', ['4 + 15', '15 + 4 + 4', '15 + 15 + 15 + 15', '4 + 4 + 4'], 2, '4 × 15 means four groups of 15, so add 15 four times.'),
            Q('medium', 'What is 34 × 5?', ['150', '175', '170', '160'], 2, '4 × 5 = 20 (write 0, carry 2). 3 × 5 = 15, plus 2 = 17. Answer: 170.'),
            Q('medium', 'What is 125 × 4?', ['480', '520', '450', '500'], 3, '100 × 4 = 400 and 25 × 4 = 100, so 400 + 100 = 500.'),
            Q('medium', 'A jeepney carries 18 passengers. How many passengers can 6 full jeepneys carry?', ['98', '108', '24', '118'], 1, '18 × 6: 8 × 6 = 48 (write 8, carry 4), 1 × 6 = 6, plus 4 = 10. Answer: 108.'),
            Q('hard', 'What is 23 × 14?', ['312', '322', '332', '115'], 1, '23 × 4 = 92 and 23 × 10 = 230. Then 92 + 230 = 322.'),
            Q('hard', 'A box has 24 mangoes. How many mangoes are in 15 boxes?', ['360', '350', '39', '340'], 0, '24 × 15 = (24 × 10) + (24 × 5) = 240 + 120 = 360.'),
            Q('hard', 'Estimate 48 × 21 by rounding each number to the nearest ten.', ['800', '1,000', '1,200', '900'], 1, '48 rounds to 50 and 21 rounds to 20. 50 × 20 = 1,000.')
          ]
        },
        {
          id: 'math-3',
          title: 'Fraction Forest',
          short: 'Fractions',
          competency: 'Identifies, compares, and finds equivalent fractions.',
          lesson: [
            'A <b>fraction</b> shows part of a whole. In <b>3/4</b>, the bottom number (denominator) tells how many equal parts. The top number (numerator) tells how many parts we take.',
            '<b>Equivalent fractions</b> name the same amount: 1/2 = 2/4 = 4/8. Multiply or divide the top and bottom by the same number.',
            'Same denominator? The bigger numerator wins: 5/8 &gt; 3/8.',
            'Same numerator? The smaller denominator means bigger pieces: 1/3 &gt; 1/5.'
          ],
          questions: [
            Q('easy', 'In the fraction 3/5, what is the denominator?', ['3', '5', '8', '2'], 1, 'The denominator is the bottom number. It tells how many equal parts there are: 5.'),
            Q('easy', 'A pizza is cut into 8 equal slices. You eat 3. What fraction did you eat?', ['3/8', '8/3', '5/8', '3/5'], 0, 'You ate 3 out of 8 equal slices, so the fraction is 3/8.'),
            Q('easy', 'Which is bigger: 5/9 or 2/9?', ['2/9', '5/9', 'They are equal', 'We can’t tell'], 1, 'Both have 9 parts. 5 parts is more than 2 parts, so 5/9 is bigger.'),
            Q('medium', 'Which fraction is equivalent to 1/2?', ['1/4', '2/3', '2/4', '3/5'], 2, 'Multiply the top and bottom of 1/2 by 2 and you get 2/4.'),
            Q('medium', 'Which is greater: 1/3 or 1/6?', ['1/6', '1/3', 'They are equal', 'We can’t tell'], 1, 'Cutting into 3 pieces makes bigger pieces than cutting into 6, so 1/3 is greater.'),
            Q('medium', 'Fill in the blank: 2/3 = ?/9', ['6', '3', '5', '9'], 0, '3 × 3 = 9, so also do 2 × 3 = 6. That gives 6/9.'),
            Q('hard', 'Which list goes from LEAST to GREATEST?', ['1/2, 1/4, 1/8', '1/4, 1/8, 1/2', '1/2, 1/8, 1/4', '1/8, 1/4, 1/2'], 3, 'With the same numerator, more pieces means smaller pieces: 1/8 < 1/4 < 1/2.'),
            Q('hard', 'Lito ate 2/6 of a cake. Bea ate 1/3 of the same cake. Who ate more?', ['Lito', 'Bea', 'They ate the same amount', 'Not enough information'], 2, '2/6 simplifies to 1/3 (divide top and bottom by 2), so they ate the same amount.'),
            Q('hard', 'Which fraction is NOT equivalent to 3/4?', ['6/8', '4/6', '9/12', '12/16'], 1, '6/8, 9/12, and 12/16 all simplify to 3/4. But 4/6 simplifies to 2/3.')
          ]
        },
        {
          id: 'math-4',
          title: 'Perimeter Plains',
          short: 'Perimeter',
          competency: 'Finds the perimeter of triangles, squares, rectangles, and other polygons.',
          lesson: [
            '<b>Perimeter</b> is the distance around a shape. Add the lengths of all its sides.',
            'Square: 4 equal sides → <b>P = 4 × side</b>.',
            'Rectangle: <b>P = 2 × length + 2 × width</b>. A rectangle 6 m long and 4 m wide: 6 + 4 + 6 + 4 = 20 m.',
            'Always write the unit (cm, m)!'
          ],
          questions: [
            Q('easy', 'What is perimeter?', ['The distance around a shape', 'The space inside a shape', 'The number of corners', 'The longest side'], 0, 'Perimeter is the total length around the outside of a shape.'),
            Q('easy', 'A square has sides of 5 cm. What is its perimeter?', ['10 cm', '20 cm', '25 cm', '15 cm'], 1, 'A square has 4 equal sides: 4 × 5 cm = 20 cm.'),
            Q('easy', 'A triangle has sides of 3 cm, 4 cm, and 5 cm. What is its perimeter?', ['7 cm', '9 cm', '12 cm', '60 cm'], 2, 'Add all three sides: 3 + 4 + 5 = 12 cm.'),
            Q('medium', 'A rectangle is 8 m long and 3 m wide. What is its perimeter?', ['24 m', '11 m', '16 m', '22 m'], 3, '8 + 3 + 8 + 3 = 22 m. (24 is the area, not the perimeter!)'),
            Q('medium', 'A fence goes around a square garden with 12 m sides. How long is the fence?', ['48 m', '24 m', '144 m', '36 m'], 0, '4 × 12 m = 48 m of fence.'),
            Q('medium', 'A hexagon has 6 equal sides of 7 cm. What is its perimeter?', ['13 cm', '42 cm', '49 cm', '35 cm'], 1, '6 sides × 7 cm = 42 cm.'),
            Q('hard', 'A rectangle has a perimeter of 30 cm and a length of 10 cm. What is its width?', ['10 cm', '20 cm', '5 cm', '3 cm'], 2, 'Two lengths = 20 cm. 30 − 20 = 10 cm for two widths, so one width is 5 cm.'),
            Q('hard', 'A square has a perimeter of 36 cm. How long is one side?', ['6 cm', '12 cm', '18 cm', '9 cm'], 3, 'A square has 4 equal sides: 36 ÷ 4 = 9 cm.'),
            Q('hard', 'A basketball court is 28 m by 15 m. The coach jogs around it 2 times. How far does the coach jog?', ['86 m', '172 m', '43 m', '420 m'], 1, 'One lap: 28 + 15 + 28 + 15 = 86 m. Two laps: 86 × 2 = 172 m.')
          ]
        }
      ]
    },

    /* ------------------------------------------------------------- */
    {
      id: 'science',
      name: 'Science',
      icon: 'flask-conical',
      emoji: '🔬',
      color: '#15803D',
      light: '#DCFCE7',
      tagline: 'Explore matter, life, and weather',
      quests: [
        {
          id: 'sci-1',
          title: 'Matter Lab',
          short: 'States of Matter',
          competency: 'Classifies materials as solid, liquid, or gas and describes how heating and cooling change them.',
          lesson: [
            'Everything around you is <b>matter</b> — it has mass and takes up space.',
            '<b>Solids</b> keep their own shape (a stone, a pencil). <b>Liquids</b> take the shape of their container but keep their amount (water, cooking oil). <b>Gases</b> spread out to fill any container (air in a balloon).',
            'Heating and cooling change matter: ice <b>melts</b> into water, water <b>evaporates</b> into water vapor, and water vapor <b>condenses</b> back into droplets.'
          ],
          questions: [
            Q('easy', 'Which of these is a solid?', ['Juice', 'Rock', 'Air', 'Steam'], 1, 'A rock keeps its own shape, so it is a solid.'),
            Q('easy', 'Which of these is a liquid?', ['Cooking oil', 'Chair', 'Oxygen', 'Ice cube'], 0, 'Cooking oil flows and takes the shape of its container, so it is a liquid.'),
            Q('easy', 'What is inside an inflated balloon?', ['A liquid', 'A solid', 'A gas (air)', 'Nothing at all'], 2, 'A balloon is filled with air, which is a gas that spreads out to fill it.'),
            Q('medium', 'Which is true about liquids?', ['They always keep their own shape', 'They take the shape of their container', 'They cannot be poured', 'They spread out to fill a whole room'], 1, 'Liquids flow and take the shape of whatever container they are in.'),
            Q('medium', 'What happens to ice left under the sun?', ['It becomes harder', 'Nothing happens', 'It turns into sand', 'It melts into water'], 3, 'Heat from the sun makes ice melt and change from solid to liquid.'),
            Q('medium', 'Wet clothes dry under the sun because the water ___.', ['evaporates', 'freezes', 'melts', 'becomes a solid'], 0, 'The sun’s heat turns the water into water vapor. This is called evaporation.'),
            Q('hard', 'Which change can be reversed (undone)?', ['Burning paper', 'Melting chocolate', 'Cooking an egg', 'A nail rusting'], 1, 'Melted chocolate becomes solid again when it cools. The other changes cannot be undone.'),
            Q('hard', 'Water droplets form on the outside of a cold glass. What is this called?', ['Evaporation', 'Melting', 'Condensation', 'Freezing'], 2, 'Water vapor in the air cools on the cold glass and turns back into liquid: condensation.'),
            Q('hard', 'You pour 1 liter of water from a tall bottle into a wide bowl. What happens to the amount of water?', ['It increases', 'It decreases', 'It disappears', 'It stays the same (1 liter)'], 3, 'A liquid changes its shape, not its amount. It is still 1 liter.')
          ]
        },
        {
          id: 'sci-2',
          title: 'Living Things Jungle',
          short: 'Plant Parts',
          competency: 'Identifies the main parts of plants and describes their functions.',
          lesson: [
            '<b>Roots</b> hold the plant in the soil and absorb water and minerals.',
            'The <b>stem</b> holds the plant up and carries water and food to other parts.',
            '<b>Leaves</b> make food for the plant using sunlight, air, and water. This is called <b>photosynthesis</b>.',
            '<b>Flowers</b> help the plant make seeds, and <b>fruits</b> protect the seeds — like the coconut!'
          ],
          questions: [
            Q('easy', 'Which plant part absorbs water from the soil?', ['Leaves', 'Roots', 'Flower', 'Fruit'], 1, 'Roots grow in the soil and soak up water and minerals.'),
            Q('easy', 'Which plant part makes food for the plant?', ['Leaves', 'Roots', 'Stem', 'Seeds'], 0, 'Leaves use sunlight, air, and water to make food.'),
            Q('easy', 'Which plant part holds the plant up?', ['Flower', 'Leaves', 'Stem', 'Roots'], 2, 'The stem holds the plant up and carries water and food.'),
            Q('medium', 'Plants make their own food through:', ['Evaporation', 'Digestion', 'Condensation', 'Photosynthesis'], 3, 'Photosynthesis is how leaves make food using sunlight, air, and water.'),
            Q('medium', 'What does a plant need to make food?', ['Sunlight, water, and air', 'Only soil', 'Only darkness', 'Sugar and salt'], 0, 'Leaves need sunlight, water, and air (carbon dioxide) to make food.'),
            Q('medium', 'What is the main job of a flower?', ['To absorb water', 'To help the plant make seeds', 'To hold the soil', 'To carry water to the leaves'], 1, 'Flowers help the plant make seeds so new plants can grow.'),
            Q('hard', 'A plant is kept in a dark closet for two weeks. What will most likely happen?', ['It will grow faster', 'It will become greener', 'It will turn pale and weak', 'It will make more food'], 2, 'Without sunlight, the leaves cannot make food, so the plant becomes pale and weak.'),
            Q('hard', 'The kamote (sweet potato) we boil for merienda is which plant part?', ['Stem', 'Root', 'Flower', 'Fruit'], 1, 'Kamote is a storage root — it keeps food for the plant underground.'),
            Q('hard', 'Why are roots important during heavy rain?', ['They make flowers bloom', 'They make leaves fall', 'They turn rain into sugar', 'They hold the soil and help prevent erosion'], 3, 'Roots grip the soil so it is not easily washed away by rain.')
          ]
        },
        {
          id: 'sci-3',
          title: 'Weather Watch',
          short: 'Weather',
          competency: 'Describes weather conditions, uses simple weather instruments, and practices typhoon safety.',
          lesson: [
            '<b>Weather</b> is what the air is like at a certain place and time: sunny, cloudy, rainy, windy, or stormy.',
            'Weather tools: a <b>thermometer</b> measures temperature, a <b>rain gauge</b> measures rainfall, and a <b>wind vane</b> shows wind direction.',
            '<b>PAGASA</b> forecasts the weather in the Philippines and raises Tropical Cyclone Wind Signals. A higher signal number means stronger winds.',
            'During a typhoon: stay indoors, listen to updates, keep an emergency kit ready, and follow the adults at home.'
          ],
          questions: [
            Q('easy', 'Which tool measures temperature?', ['Rain gauge', 'Thermometer', 'Wind vane', 'Ruler'], 1, 'A thermometer tells us how hot or cold it is.'),
            Q('easy', 'Dark, thick clouds in the sky usually mean...', ['Rain may come soon', 'It will snow', 'It will be very sunny', 'Nothing will happen'], 0, 'Dark, thick clouds are full of water droplets, so rain may come soon.'),
            Q('easy', 'Which agency gives weather forecasts in the Philippines?', ['DepEd', 'PAGASA', 'DOH', 'LTO'], 1, 'PAGASA is the Philippine weather agency.'),
            Q('medium', 'What does a wind vane show?', ['How hot it is', 'How much rain fell', 'The direction the wind is blowing', 'How long the day is'], 2, 'A wind vane turns to point toward where the wind is coming from.'),
            Q('medium', 'What should you do during a typhoon?', ['Stay indoors and listen to updates', 'Play outside in the rain', 'Swim in the river', 'Climb a tree to watch the storm'], 0, 'Staying indoors and listening to news keeps you safe and informed.'),
            Q('medium', 'What does a rain gauge measure?', ['Wind speed', 'Amount of rainfall', 'Temperature', 'Air pressure'], 1, 'A rain gauge collects rain so we can measure how much fell.'),
            Q('hard', 'What does a HIGHER Tropical Cyclone Wind Signal number mean?', ['The storm is far away', 'The typhoon is over', 'Classes will surely continue', 'Stronger winds are expected'], 3, 'Higher signal numbers warn that stronger, more dangerous winds are expected.'),
            Q('hard', 'Why should a family prepare an emergency kit before typhoon season?', ['To decorate the house', 'To sell it to neighbors', 'To have water, food, a flashlight, and first aid ready', 'To play with during the storm'], 2, 'If power or roads are cut, the kit gives the family what they need to stay safe.'),
            Q('hard', 'It was 24°C at 6 AM and 31°C at noon. By how much did the temperature rise?', ['55°C', '7°C', '6°C', '8°C'], 1, 'Subtract: 31 − 24 = 7°C.')
          ]
        }
      ]
    },

    /* ------------------------------------------------------------- */
    {
      id: 'english',
      name: 'English',
      icon: 'book-open',
      emoji: '📚',
      color: '#C2410C',
      light: '#FFEDD5',
      tagline: 'Words, grammar, and reading',
      quests: [
        {
          id: 'eng-1',
          title: 'Noun Town',
          short: 'Nouns',
          competency: 'Identifies and uses common, proper, singular, and plural nouns.',
          lesson: [
            'A <b>noun</b> names a person, place, animal, thing, or idea: teacher, Manila, carabao, ball, kindness.',
            '<b>Common nouns</b> are general (city). <b>Proper nouns</b> are specific and start with a capital letter (Cebu City).',
            '<b>Plural</b> means more than one: add -s (book → books), add -es after s, x, ch, sh (box → boxes), or change y to i and add -es (baby → babies).',
            'Some plurals are irregular: child → children, mouse → mice, foot → feet.'
          ],
          questions: [
            Q('easy', 'Which word is a noun?', ['run', 'happy', 'mango', 'quickly'], 2, 'A mango is a thing, so “mango” is a noun.'),
            Q('easy', 'Which is a proper noun?', ['island', 'Bohol', 'beach', 'river'], 1, 'Bohol is the name of a specific place, so it starts with a capital letter.'),
            Q('easy', 'What is the plural of “book”?', ['books', 'bookes', 'bookies', 'book'], 0, 'Most nouns just add -s: book → books.'),
            Q('medium', 'What is the plural of “box”?', ['boxs', 'boxies', 'boxes', 'box’s'], 2, 'Nouns ending in x add -es: box → boxes.'),
            Q('medium', 'Which sentence uses capital letters correctly?', ['we visited rizal park last sunday.', 'We visited Rizal park last sunday.', 'we visited rizal Park last Sunday.', 'We visited Rizal Park last Sunday.'], 3, 'The first word, the park’s name, and the day of the week all need capital letters.'),
            Q('medium', 'What is the plural of “baby”?', ['babys', 'babies', 'babyes', 'baby'], 1, 'Change the y to i and add -es: baby → babies.'),
            Q('hard', 'What is the plural of “child”?', ['children', 'childs', 'childes', 'childrens'], 0, '“Child” is irregular. Its plural is “children.”'),
            Q('hard', 'Which group has ONLY nouns?', ['jump, sing, dance', 'teacher, school, pencil', 'big, small, tall', 'slowly, softly, loudly'], 1, 'Teacher (person), school (place), and pencil (thing) are all nouns.'),
            Q('hard', 'Find the COMMON noun: “Lola Nena bought fresh fish at Bankerohan Market.”', ['Lola Nena', 'Bankerohan Market', 'fish', 'bought'], 2, '“Fish” is a general thing. Lola Nena and Bankerohan Market are proper nouns.')
          ]
        },
        {
          id: 'eng-2',
          title: 'Verb Valley',
          short: 'Verbs & Tense',
          competency: 'Uses verbs that agree with the subject in the simple present and simple past tense.',
          lesson: [
            'A <b>verb</b> shows action or being: jump, eat, is, are.',
            '<b>Subject–verb agreement</b>: one person or thing → verb ends in -s (She reads). Many, or I/you → no -s (They read).',
            '<b>Past tense</b> tells what already happened: add -ed (play → played). Some are irregular: go → went, eat → ate, see → saw.',
            'Clue words: <i>yesterday, last week</i> → past. <i>every day, always</i> → present.'
          ],
          questions: [
            Q('easy', 'Which word is a verb?', ['blue', 'swim', 'chair', 'happy'], 1, '“Swim” is an action, so it is a verb.'),
            Q('easy', '“The cat ___ on the mat.”', ['sleeps', 'sleep', 'sleeping', 'sleeped'], 0, 'One cat → the verb ends in -s: sleeps.'),
            Q('easy', 'What is the past tense of “play”?', ['plays', 'playing', 'played', 'will play'], 2, 'Add -ed to show it already happened: played.'),
            Q('medium', '“My friends ___ basketball every Saturday.”', ['plays', 'playing', 'is play', 'play'], 3, '“Friends” is more than one, so use “play” with no -s.'),
            Q('medium', 'What is the past tense of “go”?', ['goed', 'went', 'gone', 'goes'], 1, '“Go” is irregular. Its simple past tense is “went.”'),
            Q('medium', '“Yesterday, Lia ___ a kite.”', ['makes', 'make', 'made', 'making'], 2, '“Yesterday” tells us it is past tense. The past of “make” is “made.”'),
            Q('hard', 'Which sentence is correct?', ['He don’t like spicy food.', 'He doesn’t likes spicy food.', 'He do not likes spicy food.', 'He doesn’t like spicy food.'], 3, 'With “he,” use “doesn’t,” and the main verb stays in its base form: like.'),
            Q('hard', '“Every morning, Tatay ___ coffee, but yesterday he ___ tea.”', ['drink / drinks', 'drinks / drank', 'drank / drinks', 'drinking / drink'], 1, '“Every morning” → present (drinks). “Yesterday” → past (drank).'),
            Q('hard', '“The students in the library ___ quiet.”', ['is', 'be', 'are', 'am'], 2, 'The subject is “students” (more than one), so use “are.”')
          ]
        },
        {
          id: 'eng-3',
          title: 'Reading Reef',
          short: 'Context Clues',
          competency: 'Uses context clues to find word meanings and identifies the main idea of a short text.',
          lesson: [
            '<b>Context clues</b> are hints in a sentence that help you guess a new word’s meaning.',
            'Synonym clue: “The road was <i>slippery</i>, or smooth and wet.” Antonym clue: “Unlike his <i>timid</i> brother, Ben is brave.” So timid means shy.',
            'The <b>main idea</b> is what a paragraph is mostly about. The other sentences are <b>supporting details</b>.'
          ],
          questions: [
            Q('easy', '“The puppy was tiny, so small that it fit in my hand.” What does tiny mean?', ['very small', 'very loud', 'very fast', 'very old'], 0, 'The clue “so small that it fit in my hand” tells us tiny means very small.'),
            Q('easy', '“Mila was glad, or happy, when she saw her lola.” What does glad mean?', ['angry', 'sleepy', 'happy', 'scared'], 2, 'The words “or happy” give the meaning right away.'),
            Q('easy', '“Carabaos help farmers plow fields. They carry heavy loads. They are strong and hardworking.” What is the main idea?', ['Farmers like rice', 'Carabaos are helpful, hardworking animals', 'Fields are wide', 'Loads are heavy'], 1, 'Every sentence tells how carabaos help, so that is the main idea.'),
            Q('medium', '“Unlike the noisy market, the library was silent.” What does silent mean?', ['very crowded', 'very bright', 'very messy', 'very quiet'], 3, '“Unlike the noisy market” is an antonym clue, so silent means very quiet.'),
            Q('medium', '“After the long hike, the scouts were exhausted and fell asleep right away.” What does exhausted mean?', ['very tired', 'very excited', 'very hungry', 'very cold'], 0, 'A long hike and falling asleep right away are clues that they were very tired.'),
            Q('medium', '“Mangroves grow along the coast. Their roots protect the shore from big waves. They are also homes for fish and crabs.” What is the main idea?', ['Crabs are tasty', 'Big waves are dangerous', 'Mangroves are important to the coast', 'Fish live in rivers'], 2, 'All the details explain why mangroves matter to coastal areas.'),
            Q('hard', '“The river water was murky; we could not see the fish below.” What does murky mean?', ['clear and clean', 'dark and cloudy', 'cold and icy', 'fast and deep'], 1, 'If you cannot see the fish, the water must be dark and cloudy.'),
            Q('hard', 'Which sentence SUPPORTS the main idea “Bananas are a healthy snack”?', ['Bananas are yellow when ripe.', 'My cousin sells bananas.', 'Monkeys like bananas.', 'Bananas have vitamins that help our body.'], 3, 'Only the sentence about vitamins explains why bananas are healthy.'),
            Q('hard', '“Rico is frugal. He saves his baon and never buys things he does not need.” What does frugal mean?', ['very generous', 'always hungry', 'careful with money', 'very forgetful'], 2, 'Saving his baon and not buying extra things shows he is careful with money.')
          ]
        }
      ]
    }
  ],

  /* ---------------------------------------------------------------
     BADGES — the unlock rules live in quiz.js (Badges.evaluate).
     --------------------------------------------------------------- */
  badges: [
    { id: 'first-steps', emoji: '🥾', name: 'First Steps', desc: 'Finish your first challenge' },
    { id: 'perfect', emoji: '💯', name: 'Perfect Score', desc: 'Get every answer right' },
    { id: 'on-fire', emoji: '🔥', name: 'On Fire', desc: '5 correct answers in a row' },
    { id: 'speedy', emoji: '⚡', name: 'Lightning Fast', desc: 'Answer in under 6 seconds on average (80%+ correct)' },
    { id: 'comeback', emoji: '🌱', name: 'Comeback Kid', desc: 'Beat your old best on a quest' },
    { id: 'steady', emoji: '📅', name: 'Steady Learner', desc: 'Learn 3 days in a row' },
    { id: 'explorer', emoji: '🧭', name: 'Explorer', desc: 'Try a quest in every subject' },
    { id: 'math-star', emoji: '🔢', name: 'Math Star', desc: 'Finish all Math quests' },
    { id: 'science-star', emoji: '🔬', name: 'Science Star', desc: 'Finish all Science quests' },
    { id: 'english-star', emoji: '📚', name: 'English Star', desc: 'Finish all English quests' }
  ],

  // Avatar choices for the student (DiceBear cartoon seeds — no photos!)
  avatarSeeds: ['Kiko', 'Mayumi', 'Bituin', 'Dagat', 'Ulap', 'Tala', 'Bagwis', 'Liwayway'],

  // Friendly lines for feedback. Wrong-answer lines must NEVER shame the child.
  cheers: ['Awesome!', 'You got it!', 'Galing!', 'Super!', 'Nice one!', 'Brilliant!'],
  encouragements: [
    'Not quite — that’s okay! Mistakes help us learn. 💪',
    'Good try! Let’s look at why. 🌱',
    'Almost! Every try makes your brain stronger. 🧠',
    'No worries — now you know for next time! ✨'
  ],
  timeUpLines: ['Time’s up! Here’s the answer so you’ll know next time. ⏰']
};

/* ---------------------------------------------------------------------
   FAKE CLASSMATES (20) — nicknames only, generated with a seeded random
   number generator so everyone sees the same demo data every time.
   Each classmate has a "skill" (0–1). Their mastery on each quest is
   based on that skill minus how hard the quest is, plus a little noise.
   --------------------------------------------------------------------- */
function seededRandom(seed) {
  // mulberry32 — a tiny, well-known seeded random generator
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

(function buildClassmates() {
  const names = ['Juan D.', 'Maria S.', 'Jose R.', 'Ana L.', 'Miguel T.', 'Sofia G.', 'Gabriel C.', 'Isabella M.',
    'Rafael B.', 'Andrea V.', 'Carlo P.', 'Bea F.', 'Paolo N.', 'Kyla A.', 'Enzo H.', 'Trisha O.',
    'Marco E.', 'Angel Q.', 'Luis Y.', 'Jasmine U.'];

  // How hard each quest is for the class (bigger = lower scores).
  // Fractions is deliberately the hardest so the heatmap tells a story.
  const hardness = { 'math-1': 0.0, 'math-2': 0.05, 'math-3': 0.25, 'math-4': 0.08,
    'sci-1': 0.02, 'sci-2': 0.0, 'sci-3': 0.1, 'eng-1': 0.0, 'eng-2': 0.12, 'eng-3': 0.06 };
  // Chance a student has tried a quest, by its position in the quest map.
  const attemptChance = [0.97, 0.85, 0.7, 0.5];

  const rand = seededRandom(2026);
  EQ_DATA.classmates = names.map((nickname, i) => {
    const skill = 0.45 + rand() * 0.5;           // 0.45 – 0.95
    const mastery = {};
    const attempts = {};
    let improvementTotal = 0, improvementCount = 0;
    EQ_DATA.subjects.forEach(subject => {
      subject.quests.forEach((quest, qi) => {
        if (rand() > attemptChance[qi]) { mastery[quest.id] = null; attempts[quest.id] = 0; return; }
        const score = Math.round(100 * (skill - hardness[quest.id] + (rand() - 0.5) * 0.3));
        mastery[quest.id] = Math.max(17, Math.min(100, score));
        attempts[quest.id] = 1 + Math.floor(rand() * 3);
        if (attempts[quest.id] > 1) { improvementTotal += 5 + rand() * 20; improvementCount++; }
      });
    });
    return {
      id: 'cm-' + i,
      nickname,
      avatar: nickname,
      skill,
      mastery,
      attempts,
      improvement: improvementCount ? Math.round(improvementTotal / improvementCount) : 0,
      minutesThisWeek: Math.round(20 + skill * 80 + rand() * 40),
      lastActiveDaysAgo: Math.floor(rand() * rand() * 12)  // most were active recently
    };
  });
})();

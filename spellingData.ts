import type { PersonalNarrativeLevel, LetterWritingLevel, CustomReadingActivity, VocabularyLesson, StudentProfile, ContentAssignment } from './types';

// --- STUDENT ROSTERS ---
export const studentsByGrade = {
    'Grade 3 O': [
        'Bander Mohammed A Al Barrak', 'Aarish Asif khan', 'Mohamed Gaballa Ramadan Gaballa Eltabakh', 'Ziyad Wasim Baig',
        'Tameem Ahmed G Alharbi', 'Omar Faisal A Al Qanass', 'Lohitashwa Lakshmanaperumal', 'Muhammad - - Ahmed',
        'Albraa Maher A Ainaddin', 'Mohammad Murtaza Mir', 'Abdul Muiz Aboobacker Siddhique', 'Abdulrahman Hamoud A Alsaif',
        'Abdur Rahman', 'Azzam Hafidz Althof', 'Faisal Sultan H Alshammari', 'Husam Yousef A Alshyeb',
        'Kareem Alturabi Mukhtar Ahmed', 'Abdullah Asan Wirba', 'Abdullah Feras A Al Qanass', 'Malik Ahmed Mohamed Thabet Hassan',
        'Saad Bin Waqas', 'Mohammad Rayyan', 'Syed Ahmed Irfan', 'Muhammad Moosa', 'Zain Sayed Gouda Sayed Abbas', 'Rehan Hussain'
    ],
    'Grade 3 P': [
        'Abdullah faisal A Alboainain', 'Ali Salman A Alshammari', 'Ahmed Mohammed S Al Fares', 'Faris Naif S Alruwais',
        'Muhammad Ahmad Raheel', 'Mustafa Mahmoud Gamal Mohammed Abdelghany Azouz', 'Mirza Muhammad Ali Baig Chaghtai',
        'Khalid Fayez A Aldossary', 'Hamza Ahmed Hamdy Hussein Ezeldin Abdelhamid', 'Azzam Khalid A Alsumairy',
        'Badreldin Khalid Badreldin Mohamed', 'Burhan Ijaz', 'Hadi Hussain S Alrasheed', 'Hazem Ahmed Hamdy Hussein Ezeldin Abdelhamid',
        'Mohammad Dawood Imran', 'Muhammad - Rayyan', 'Sharaf Abdulrahman S Alsaqabi', 'Suleiman Tijjani Ahmad',
        'Turki Abdullah S Alanazi', 'Izyan Salman Tariq', 'Ahmed Abdullah A Baghdadi', 'Adi Ferhad Bin Mohd Fadzlee',
        'Ali Hussain Syed', 'Muhammad Hadif Amsyar Bin Izwan Shah', 'Misbah Rahman', 'Adam Mohamed Tarek Elsabbagh'
    ]
};

// --- CURRICULUM CONTENT ---

const grammarTopics: string[] = [
    'Singular & Plural Nouns',
    'Common & Proper Nouns',
    'Abstract & Concrete Nouns',
    'Subject & Predicate',
    'Subject Verb Agreement (s/es)',
    'Verbs',
    'Adjectives',
    'Pronouns',
    'Punctuation',
    'Tenses (Past, Present, Future)',
];

const readingSkills: string[] = [
    'Main Idea',
    'Inferencing',
    'Sequencing',
    'Cause and Effect',
    'Vocabulary in Context',
    'Visualizing',
    'Prediction',
];

const learnToWriteCategories: string[] = [
    'Personal Narrative',
    'Letter Writing',
];

const coverTheBasicsStructure = [
    {
        id: 'CVC',
        name: 'CVC Words' as const,
        description: 'Learn consonant-vowel-consonant words.',
        enabled: true,
        levels: [
            { id: 'CVC_STARTER', name: 'Starter', sessions: 6, dependency: null, enabled: true },
            { id: 'CVC_GROWING', name: 'Growing', sessions: 8, dependency: 'CVC_STARTER', enabled: true },
            { id: 'CVC_LEAPING', name: 'Leaping', sessions: 10, dependency: 'CVC_GROWING', enabled: true }
        ]
    },
    {
        id: 'SCRAMBLE',
        name: 'Sentence Scramble' as const,
        description: 'Unscramble words to make sentences.',
        enabled: true,
        levels: [
            { id: 'SCRAMBLE_STARTER', name: 'Starter', sessions: 6, dependency: 'CVC_LEAPING', enabled: true },
            { id: 'SCRAMBLE_GROWING', name: 'Growing', sessions: 8, dependency: 'SCRAMBLE_STARTER', enabled: true },
            { id: 'SCRAMBLE_LEAPING', name: 'Leaping', sessions: 10, dependency: 'SCRAMBLE_GROWING', enabled: true }
        ]
    },
    {
        id: 'PARAGRAPH',
        name: 'Paragraph Comprehension' as const,
        description: 'Read and understand short paragraphs.',
        enabled: true,
        levels: [
            { id: 'PARAGRAPH_STARTER', name: 'Starter', sessions: 6, dependency: 'SCRAMBLE_LEAPING', enabled: true },
            { id: 'PARAGRAPH_GROWING', name: 'Growing', sessions: 8, dependency: 'PARAGRAPH_STARTER', enabled: true },
            { id: 'PARAGRAPH_LEAPING', name: 'Leaping', sessions: 10, dependency: 'PARAGRAPH_GROWING', enabled: true }
        ]
    }
];


// --- GUIDED WRITING DATA ---
const personalNarrativeLevels: PersonalNarrativeLevel[] = [
    { level: 1, title: "A Happy Day", prompt: "Write a short story about a time you felt very happy.", example: { brainstorm: { who: "My dad and me", where: "The park", what: "Played on swings and got ice cream.", feelings: "Very happy, best day." }, narrative: "My favorite day is Friday. Last Friday, my dad took me to the park after school.\n\nFirst, we played on the swings and I went down the big slide five times! After that, we got chocolate ice cream. It was delicious.\n\nFinally, it was the best Friday because I spent time with my dad and had my favorite treat." }, secretKey: { word: "KINDNESS", question: "What is one way to show kindness to a new student at school?" } },
    { level: 2, title: "Favorite Holiday", prompt: "Write about your favorite holiday and what you do on that day.", example: { brainstorm: { who: "My whole family", where: "Grandma's house", what: "Ate yummy food and opened presents.", feelings: "Excited and thankful." }, narrative: "My favorite holiday is Eid. My whole family goes to my grandma's house to celebrate.\n\nFirst, we all wear new clothes and say Eid Mubarak to everyone. Then, we eat a big meal with lots of delicious food. My favorite part is getting gifts from the grown-ups!\n\nIn the end, I feel so happy and thankful to be with my family. It's the best day of the year." }, secretKey: { word: "RESPECT", question: "How can you show respect to your teachers and classmates?" } },
    { level: 3, title: "A Funny Moment", prompt: "Write about something funny that happened at school.", example: { brainstorm: { who: "Me and my friend Sam", where: "The classroom", what: "Sam wore his shirt backwards all day.", feelings: "Funny and silly." }, narrative: "I want to tell you about a funny thing that happened at school. My friend Sam made everyone laugh.\n\nHe came to school and was playing with us all morning. After lunch, our teacher, Ms. Rose, noticed that Sam's shirt was on backwards! The tag was sticking out in the front.\n\nIn the end, we all had a good laugh, even Sam. He said he was in a hurry. It was a very silly day." }, secretKey: { word: "EMPATHY", question: "If you see someone who is sad, what is one thing you can do to show you understand their feelings?" } },
    { level: 4, title: "First Day of School", prompt: "Write about your first day in this grade.", example: { brainstorm: { who: "My new teacher and friends", where: "My new classroom", what: "I was nervous but then I made a new friend.", feelings: "Nervous then happy." }, narrative: "I remember my first day of Grade 3. I was a little bit nervous because I didn't know anyone.\n\nFirst, I walked into the classroom and found my desk. Then, a girl named Lily smiled at me. We talked about our favorite colors and animals during recess. We decided to be friends.\n\nFinally, by the end of the day, I wasn't nervous anymore. I was excited to come back to school the next day." }, secretKey: { word: "FAIRNESS", question: "When playing a game, why is it important to make sure everyone plays by the rules?" } },
    { level: 5, title: "A Time You Helped", prompt: "Write about a time you helped someone.", example: { brainstorm: { who: "My mom and me", where: "The kitchen", what: "I helped her carry the groceries inside.", feelings: "Proud and helpful." }, narrative: "It is very important to help others. I remember a time I helped my mom and felt very proud.\n\nLast weekend, she came home with many bags of groceries from the store. They looked very heavy. I ran to the door and told her I could help. I carried two of the smaller bags into the kitchen for her.\n\nIn the end, my mom gave me a big hug and said I was a great helper. It made me feel very happy and strong." }, secretKey: { word: "HONESTY", question: "If you accidentally break something, why is telling the truth the best choice?" } },
    { level: 6, title: "A Cool Dream", prompt: "Write about a dream you remember.", example: { brainstorm: { who: "Me", where: "The sky", what: "I could fly over my house and my school.", feelings: "Amazed and free." }, narrative: "Sometimes I have dreams that I can remember the next day. One time I had a dream that I could fly.\n\nIn my dream, I just flapped my arms like a bird and I went up into the sky! I flew over my house and saw my little dog in the yard. Then, I flew all the way to my school and landed on the roof.\n\nWhen I woke up, I was a little sad I couldn't really fly, but it was an amazing dream. I felt so free." }, secretKey: { word: "COURAGE", question: "What does it mean to be brave, even when you are scared?" } },
    { level: 7, title: "At The Zoo", prompt: "Write about your favorite animal you saw at the zoo.", example: { brainstorm: { who: "The monkeys and me", where: "At the city zoo", what: "I watched the monkeys swing and play.", feelings: "Entertained and happy." }, narrative: "My family and I went to the zoo last month. There were so many cool animals, but my favorite was the monkeys.\n\nFirst, we went to the monkey house. The monkeys were so funny! They were swinging from ropes and chasing each other. One little monkey made funny faces at me through the glass. I laughed so hard.\n\nIn the end, I didn't want to leave. Watching the playful monkeys was the best part of our zoo trip." }, secretKey: { word: "HELPING", question: "What is one way you can help keep your classroom clean?" } },
    { level: 8, title: "Learning Something New", prompt: "Write about a time you learned how to do something new.", example: { brainstorm: { who: "My grandpa and me", where: "The garden", what: "He taught me how to plant a flower.", feelings: "Focused and accomplished." }, narrative: "It feels good to learn new things. Last spring, my grandpa taught me how to plant a flower in the garden.\n\nFirst, he showed me how to dig a small hole in the dirt. Then, we carefully took the little flower out of its pot and put it in the hole. He showed me how to pat the dirt around it and give it some water.\n\nFinally, after a few weeks, a beautiful red flower bloomed! I was so proud that I helped it grow." }, secretKey: { word: "PATIENCE", question: "When you are learning something new and it's hard, why is it important to be patient?" } },
    { level: 9, title: "A Special Birthday", prompt: "Write about a special birthday party you had.", example: { brainstorm: { who: "My friends and family", where: "At my house", what: "I had a magic-themed party and got a bike.", feelings: "Surprised and joyful." }, narrative: "My seventh birthday was my favorite one so far. My parents planned a surprise magic-themed party for me.\n\nFirst, all my friends came over and a real magician did tricks for us! He pulled a rabbit out of a hat. Then, it was time for cake. After we sang, my parents brought out a giant present. It was a brand new blue bicycle!\n\nI was so surprised and happy. It was a truly magical day that I will never forget." }, secretKey: { word: "TEAMWORK", question: "When working on a group project, what is one thing you can do to be a good teammate?" } },
    { level: 10, title: "A Family Trip", prompt: "Write about a trip you took with your family.", example: { brainstorm: { who: "My parents, my sister, and me", where: "The beach", what: "We built sandcastles and swam in the ocean.", feelings: "Excited and relaxed." }, narrative: "Last summer, my family took a trip to the beach for a whole weekend. I had been looking forward to it for weeks.\n\nAs soon as we arrived, my sister and I ran to the water. The waves were so fun to jump in. Later, we all worked together to build a giant sandcastle with a tall tower and a moat around it. We even found pretty seashells to decorate it with.\n\nIn the end, I was sad to leave but so happy we went. Playing in the sand and swimming in the ocean with my family was the perfect trip." }, secretKey: { word: "LEADER", question: "What is one thing a good leader does to help their group?" } }
];

const letterWritingLevels: LetterWritingLevel[] = [
    { level: 1, title: "Favorite Subject", prompt: "Write a letter to a family member telling them about your favorite school subject.", example: { heading: "October 26, 2024", greeting: "Dear Mom,", body: "How are you? I wanted to tell you about my favorite subject in school. It's art!\n\nWe get to paint and draw with so many colors. Yesterday, we made clay pots. It was so much fun! I love being creative.", closing: "Love,", signature: "Alex" }, secretKey: { word: "KINDNESS", question: "What is one way to show kindness to a new student at school?" } },
    { level: 2, title: "Birthday Invitation", prompt: "Write a letter to a friend inviting them to your birthday party.", example: { heading: "November 1, 2024", greeting: "Dear Sam,", body: "I am so excited! My birthday is next week and I am having a party. I would love for you to come.\n\nThe party will be at my house on Saturday at 2:00 PM. We are going to play games and have cake. I hope you can make it!", closing: "Your friend,", signature: "Maria" }, secretKey: { word: "RESPECT", question: "How can you show respect to your teachers and classmates?" } },
    { level: 3, title: "Thank You Note", prompt: "Write a letter to your teacher to thank them for a fun lesson.", example: { heading: "September 15, 2024", greeting: "Dear Mr. David,", body: "Thank you for the science lesson today. Learning about volcanoes was so interesting!\n\nMy favorite part was when we made our own volcano erupt with baking soda and vinegar. It was so cool to watch the fizz go everywhere. I learned a lot.", closing: "Sincerely,", signature: "Leo" }, secretKey: { word: "EMPATHY", question: "If you see someone who is sad, what is one thing you can do to show you understand their feelings?" } },
    { level: 4, title: "New Pet News", prompt: "Write to a cousin telling them about a new pet.", example: { heading: "March 5, 2025", greeting: "Dear Chloe,", body: "Guess what? I have some very exciting news to share with you. We got a new kitten last week!\n\nHer name is Luna and she is all black with bright green eyes. She is very playful and loves to chase string. You have to come meet her soon!", closing: "Your cousin,", signature: "Fatima" }, secretKey: { word: "FAIRNESS", question: "When playing a game, why is it important to make sure everyone plays by the rules?" } },
    { level: 5, title: "Asking a Question", prompt: "Write to a grandparent asking about what school was like for them.", example: { heading: "February 10, 2025", greeting: "Dear Grandpa,", body: "How are you doing? We are learning about history in school, and it made me think of you.\n\nI was wondering what school was like when you were my age. Did you have computers? What was your favorite subject? I would love to hear all about it.", closing: "Love,", signature: "Omar" }, secretKey: { word: "HONESTY", question: "If you accidentally break something, why is telling the truth the best choice?" } },
    { level: 6, title: "Pen Pal Letter", prompt: "Write to a friend who moved away, telling them what's new at school.", example: { heading: "April 2, 2025", greeting: "Dear Ben,", body: "I miss having you here at school! A lot has happened since you moved. We have a new student in our class named Ali, and he is very good at soccer.\n\nWe are also planning our class project for the science fair. I wish you were here to work on it with me. Please write back and tell me about your new school!", closing: "Your best friend,", signature: "Jake" }, secretKey: { word: "COURAGE", question: "What does it mean to be brave, even when you are scared?" } },
    { level: 7, title: "Letter to a Superhero", prompt: "Write to your favorite superhero asking them about their powers.", example: { heading: "January 20, 2025", greeting: "Dear Spider-Man,", body: "You are my favorite superhero! I have so many questions for you. How does it feel to swing between tall buildings?\n\nIs it hard to shoot webs from your wrists? I think your powers are the coolest. Thank you for always keeping the city safe!", closing: "Your biggest fan,", signature: "Nora" }, secretKey: { word: "HELPING", question: "What is one way you can help keep your classroom clean?" } },
    { level: 8, title: "Tooth Fairy Letter", prompt: "Write a letter to the tooth fairy after losing a tooth.", example: { heading: "May 18, 2025", greeting: "Dear Tooth Fairy,", body: "I am so excited to write to you! I lost my front tooth today when I was eating an apple. It didn't even hurt.\n\nI have put it under my pillow in a small box for you. I hope you like it. I am excited to see if you come visit me tonight!", closing: "Sincerely,", signature: "Lily" }, secretKey: { word: "PATIENCE", question: "When you are learning something new and it's hard, why is it important to be patient?" } },
    { level: 9, title: "Zookeeper Inquiry", prompt: "Write to a zookeeper asking about your favorite animal.", example: { heading: "June 7, 2025", greeting: "Dear Zookeeper,", body: "My name is Tom and I love visiting the zoo. My favorite animals are the penguins. They are so funny when they waddle.\n\nI was wondering what you feed them every day. Do they like to swim when it's cold outside? Thank you for taking such good care of all the animals.", closing: "Your friend,", signature: "Tom" }, secretKey: { word: "TEAMWORK", question: "When working on a group project, what is one thing you can do to be a good teammate?" } },
    { level: 10, title: "Book Recommendation", prompt: "Write to a friend recommending your favorite book.", example: { heading: "July 30, 2025", greeting: "Dear Maya,", body: "I just finished the best book and I think you would love it too! It's called 'The Magical Treehouse' and it's about two kids who find a treehouse that can travel through time.\n\nMy favorite part is when they go back and see dinosaurs. It's so exciting and a little bit scary. You should definitely read it!", closing: "Your friend,", signature: "Sara" }, secretKey: { word: "LEADER", question: "What is one thing a good leader does to help their group?" } }
];

// --- MAIN CURRICULUM OBJECT ---

export const defaultCurriculum = {
    gradeLevel: "Grade 3",
    appName: "English Genius",
    grammarTopics,
    readingSkills,
    learnToWriteCategories,
    coverTheBasics: coverTheBasicsStructure,
    guidedWriting: {
        personalNarrativeLevels,
        letterWritingLevels,
    },
    featureToggles: {
        writingChecker: true,
        grammarPractice: true,
        readingComprehension: true,
        coverTheBasics: true,
        learnToWrite: true,
        guidedWriting: true,
        textLeveler: true,
        reportCard: true,
        vocabularyPractice: true,
        spellingStation: true,
        diaryLog: true,
    },
    classroomSettings: {
        enableLeaderboard: false,
    },
    customReadingActivities: [] as CustomReadingActivity[],
    customVocabularyLessons: [] as VocabularyLesson[],
    studentProfiles: [] as StudentProfile[],
    assignments: [] as ContentAssignment[],
};

export type Curriculum = typeof defaultCurriculum;


// --- LOCALSTORAGE MANAGEMENT ---

const CURRICULUM_KEY = 'englishGeniusCurriculum';

const safeJSONParse = <T>(item: string | null, fallback: T): T => {
    if (!item) return fallback;
    try {
        return JSON.parse(item);
    } catch (e) {
        console.warn('Failed to parse JSON from storage, returning fallback.', item, e);
        return fallback;
    }
};


export const getCurriculum = (): Curriculum => {
    const saved = localStorage.getItem(CURRICULUM_KEY);
    if (saved) {
        const savedData = safeJSONParse<Partial<Curriculum>>(saved, {});
        
        // Merge coverTheBasics with default to ensure `enabled` flags exist
        const mergedCoverTheBasics = defaultCurriculum.coverTheBasics.map(defaultCategory => {
            const savedCategory = Array.isArray(savedData.coverTheBasics) 
                ? savedData.coverTheBasics.find(c => c.id === defaultCategory.id)
                : undefined;
                
            if (savedCategory) {
                const mergedLevels = defaultCategory.levels.map(defaultLevel => {
                    const savedLevel = savedCategory.levels?.find(l => l.id === defaultLevel.id);
                    return { ...defaultLevel, ...(savedLevel || {}), enabled: savedLevel?.enabled ?? defaultLevel.enabled };
                });
                return { ...defaultCategory, ...savedCategory, levels: mergedLevels, enabled: savedCategory.enabled ?? defaultCategory.enabled };
            }
            return defaultCategory;
        });

        const mergedCurriculum: Curriculum = {
            ...defaultCurriculum,
            ...savedData,
            coverTheBasics: mergedCoverTheBasics,
            featureToggles: {
                ...defaultCurriculum.featureToggles,
                ...(savedData.featureToggles || {}),
            },
            guidedWriting: {
                ...defaultCurriculum.guidedWriting,
                ...(savedData.guidedWriting || {}),
            },
            classroomSettings: {
                ...defaultCurriculum.classroomSettings,
                ...(savedData.classroomSettings || {}),
            },
            customReadingActivities: savedData.customReadingActivities || [],
            customVocabularyLessons: savedData.customVocabularyLessons || [],
            studentProfiles: savedData.studentProfiles || [],
            assignments: savedData.assignments || [],
        };
        return mergedCurriculum;
    } else {
        // No curriculum saved, so set and return the default one
        localStorage.setItem(CURRICULUM_KEY, JSON.stringify(defaultCurriculum));
        return defaultCurriculum;
    }
};

export const saveCurriculum = (curriculum: Curriculum) => {
    try {
        localStorage.setItem(CURRICULUM_KEY, JSON.stringify(curriculum));
    } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
             alert("Error: The curriculum data is too large to save. This might be due to having too many high-resolution images in vocabulary lessons. Please try removing some lessons with images to free up space.");
        } else {
            console.error("Failed to save curriculum to localStorage.", error);
        }
    }
};

export const resetCurriculum = () => {
    try {
        localStorage.setItem(CURRICULUM_KEY, JSON.stringify(defaultCurriculum));
    } catch (error) {
        console.error("Failed to reset curriculum in localStorage.", error);
    }
};
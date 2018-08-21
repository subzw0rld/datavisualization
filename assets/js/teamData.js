var imagePath = 'http://127.0.0.1:5500/assets/images/emp-images/';
var skillData = {
    1: {skill: 'Project Management', color: '#FFBA08'},
    2: {skill: 'HTML', color: '#FCA311'},
    3: {skill: 'JS', color: '#A2AEBB'},
    4: {skill: 'CSS', color: '#3F88C5'},
    5: {skill: 'Angular', color: '#1C3144'},
    6: {skill: 'React', color: '#F5D0C5'},
    7: {skill: 'Typescript', color: '#D69F7E'},
    8: {skill: 'Node.js', color: '#774936'},
    9: {skill: 'Build Tools', color: '#3C0000'},
    10: {skill: 'JAVA', color: '#CBEAA6'},
    11: {skill: 'Spring MVC', color: '#C0D684'},
    12: {skill: 'ES6', color: '#F3F9D2'},
    13: {skill: 'SQL', color: '#3D0B37'},
    14: {skill: 'MVC', color: '#63264A'},
    15: {skill: 'Singleton', color: '#C7EDE4'},
    16: {skill: 'RxJS', color: '#AF9AB2'},
    17: {skill: 'Agile', color: '#820B8A'}
};

var levelData = {
    1: {level: 'Beginner', color: '#672A4E'},
    2: {level: 'Intermediate', color: '#2D93AD'},
    3: {level: 'Advanced', color: '#507DBC'},
    4: {level: 'Expert', color: '#006992'}
};

var locationData = {
    1: {location: 'Noida Site 3 Unit 1', color: '#14213D'},
    2: {location: 'Noida Sec 64', color: '#A9C5A0'},
    3: {location: 'Chennai', color: '#C6DEC6'}
};

var data = [
    {
        name: 'Ratnesh Sharma',
        empID: 608237,
        avatar: '',
        location: 1,
        desig: 'Delivery Manager - AM',
        client: ['EPO'],
        email: 'ratnesh.sharma@soprasteria.com',
        level: '5B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    {
        name: 'Anil Sharma',
        empID: 607462,
        avatar: '',
        location: 1,
        desig: 'Project Manager',
        client: ['EPO'],
        email: 'anil.sharma@soprasteria.com',
        level: '5B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    {
        name: 'Nikhil Srivastava',
        empID: 607377,
        avatar: '',
        location: 1,
        desig: 'Delivery Manager - AM',
        client: ['EPO'],
        email: 'nikhil.srivastava@soprasteria.com',
        level: '5B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ] 
    },
    {
        name: 'Vivek Govil',
        empID: 610120,
        avatar: '',
        location: 1,
        desig: 'Delivery Manager - AM',
        client: ['EPO'],
        email: 'vivek.govil@soprasteria.com',
        level: '5B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    {
        name: 'Subroto Mukherjee',
        empID: 682143,
        avatar: '',
        location: 1,
        desig: 'Consulting Architect',
        level: '5B',
        skill: [{ id: 2, level: 4 }, { id: 3, level: 4 },
            { id: 4, level: 4 }, { id: 5, level: 4 },
            { id: 6, level: 4 }, { id: 7, level: 4 },
            { id: 8, level: 4 }, { id: 9, level: 4 },
            { id: 12, level: 4 }, { id: 14, level: 4 },
            { id: 15, level: 4 }, { id: 16, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    {
        name: 'Dinesh Aneja',
        empID: 613429,
        avatar: '',
        location: 1,
        desig: 'Delivery Manager - AM',
        client: ['EPO'],
        email: 'dinesh.aneja@soprasteria.com',
        level: '5B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    {
        name: 'Amit Gupta',
        empID: 608054,
        avatar: '',
        location: 1,
        desig: 'Delivery Manager - AM',
        client: ['EPO'],
        email: 'amit.gupta@soprasteria.com',
        level: '5B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Ashwarya Sharma',
        empID: 609833,
        avatar: '',
        location: 1,
        desig: 'Senior Test Analyst',
        client: ['EPO'],
        email: 'ashwarya.sharma@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    {
        name: 'Gagandeep Singh',
        empID: 609869,
        avatar: '',
        location: 1,
        desig: 'Service Manager',
        client: ['EPO'],
        email: 'gagandeep.singh9398@soprasteria.com',
        level: '5B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    {
        name: 'Vishesh Kumar Gupta',
        empID: 670569,
        avatar: '',
        location: 1,
        desig: 'Business Consultant',
        client: ['EPO'],
        email: 'vishesh-kumar.gupta@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    {
        name: 'Preeti Bindal',
        empID: 615605,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'preeti.bindal@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    {
        name: 'Swati Khullar',
        empID: 671244,
        avatar: '',
        location: 1,
        desig: 'Senior Test Analyst',
        client: ['EPO'],
        email: 'swati.khullar@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    {
        name: 'Gaurav Pandey',
        empID: 617912,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'gaurav.pandey@soprasteria.com',
        level: '6A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    {
        name: 'Medha Kukreti',
        empID: 633925,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'medha.kukreti@soprasteria.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 678010
    },
    {
        name: 'Bhakti Soni',
        empID: 671735,
        avatar: '',
        location: 1,
        desig: 'Senior Test Analyst',
        client: ['EPO'],
        email: 'bhakti.soni@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    {
        name: 'Vineet Gupta',
        empID: 644961,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'vineet.gupta4961@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 609869
    },
    {
        name: 'Shikha Sharma',
        empID: 672267,
        avatar: '',
        location: 1,
        desig: 'Senior Test Analyst',
        client: ['EPO'],
        email: 'shikha.sharma@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    {
        name: 'Ravinder Pratap Rana',
        empID: 649959,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'ravinder.rana@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Shivangi Tripathi',
        empID: 652379,
        avatar: '',
        location: 1,
        desig: 'Junior Software Engineer',
        client: ['EPO'],
        email: 'shivangi.tripathi@soprasteria.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Abhijit Panda',
        empID: 655609,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'abhijit.panda@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    {
        name: 'Sahil Gupta',
        empID: 655694,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'sahil.gupta@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    {
        name: 'Nidhi Jain',
        empID: 657420,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'nidhi.jain1@soprasteria.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Zeeshan Waris',
        empID: 660003,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'zeeshan.waris@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Saranjeet Kaur',
        empID: 662775,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'saranjeet.kaur@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    {
        name: 'Shruti Jain',
        empID: 663428,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'shruti.jain2@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    {
        name: 'Poonam Sabharwal',
        empID: 611406,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'poonam.sabharwal@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    {
        name: 'Rashi Prakash',
        empID: 673594,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'rashi.prakash@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    {
        name: 'Rupakshi Gupta',
        empID: 674613,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'rupakshi.gupta@soprasteria.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 671244
    },
    {
        name: 'Deepanshu Garg',
        empID: 674972,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'deepanshu.garg@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    {
        name: 'Pankaj Mukesh Sharma',
        empID: 675877,
        avatar: '',
        location: 1,
        desig: 'Junior Software Engineer',
        client: ['EPO'],
        email: 'deepanshu.garg@soprasteria.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Monika Kapoor',
        empID: 676746,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'monika.kapoor@soprasteria.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Nitin Sharma',
        empID: 677842,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'nitin.sharma@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 609869
    },
    {
        name: 'Suraj Kumar Singh',
        empID: 677968,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'suraj.singh@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Abhishek Kumar',
        empID: 677969,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'abhishek.kumar2@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Karankumar Wadhwani',
        empID: 678010,
        avatar: '',
        location: 1,
        desig: 'Senior Business Analyst',
        client: ['EPO'],
        email: 'karankumar.wadhwani@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    {
        name: 'Amit Garg',
        empID: 678151,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'amit.garg@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Dipanshu Asri',
        empID: 678272,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'dipanshu.asri@soprasteria.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 609869
    },
    {
        name: 'Babloo Kumar',
        empID: 678367,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'babloo.kumar@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Narotam Pal Singh',
        empID: 678508,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'narotam.singh@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Maninder Singh Bali',
        empID: 678605,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'maninder.bali@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Manoj Kumar',
        empID: 678615,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'manoj.kumar3@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Sonu Kumar',
        empID: 678664,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'sonu.kumar@soprasteria.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    {
        name: 'Gaurav Garg',
        empID: 678815,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'gaurav.garg3@soprasteria.com',
        level: '6A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    {
        name: 'Vignesh Arivazhagan',
        empID: 678906,
        avatar: '',
        location: 3,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'vignesh.arivazhagan@soprasteria.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    {
        name: 'Deepan Kiran Kumar Vadivel',
        empID: 678907,
        avatar: '',
        location: 3,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'deepan.vadivel@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    {
        name: 'Kavita .',
        empID: 678956,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'kavita.kavita2@soprasteria.com',
        level: '6A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Chandra Bahadur',
        empID: 679082,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'chandra.bahadur@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 609869
    },
    {
        name: 'Sageer Ahmed',
        empID: 679168,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'sageer.ahmed@soprasteria.com',
        level: '6A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Abhilash Tiwari',
        empID: 679212,
        avatar: '',
        location: 1,
        desig: 'Junior Test Analyst',
        client: ['EPO'],
        email: 'abhilash.tiwari@soprasteria.com',
        level: '8B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    {
        name: 'Vaibhav .',
        empID: 679215,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'vaibhav.vaibhav2@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Gaurav Sinha',
        empID: 679265,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'gaurav.sinha@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Himanshu Vashistha',
        empID: 679378,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'himanshu.vashistha@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    {
        name: 'Vineet Raj',
        empID: 679423,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'vineet.raj@soprasteria.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    {
        name: 'Palvinder Singh',
        empID: 679487,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'palvinder.singh@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Mohammad Jamshed Akhtar',
        empID: 679567,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'mohammad.akhtar@soprasteria.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Mohammad Vaqas Azeem',
        empID: 679657,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'mohammad.azeem@soprasteria.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Ashad Naseem',
        empID: 680065,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'ashad.naseem@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Sandeep Sharma',
        empID: 680097,
        avatar: '',
        location: 1,
        desig: 'Senior Technical Architect',
        client: ['EPO'],
        email: 'sandeep.sharma@soprasteria.com',
        level: '5B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    {
        name: 'Jitendra Singh Dhanagar',
        empID: 680227,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'jitendra.dhanagar@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Ankit Jain',
        empID: 681379,
        avatar: '',
        location: 1,
        desig: 'Junior Software Engineer',
        client: ['EPO'],
        email: 'ankit.jain42@soprasteria.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608054
    },
    {
        name: 'Rajat Arora',
        empID: 681432,
        avatar: '',
        location: 1,
        desig: 'Junior Software Engineer',
        client: ['EPO'],
        email: 'rajat.arora@soprasteria.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    {
        name: 'Subroto Mukherjee',
        empID: 682143,
        avatar: '',
        location: 1,
        desig: 'Consulting Architect',
        client: ['EPO'],
        email: 'subroto.mukherjee@soprasteria.com',
        level: '5B',
        skill: [{ id: 2, level: 4 }, { id: 3, level: 4 },
            { id: 4, level: 4 }, { id: 5, level: 4 },
            { id: 6, level: 4 }, { id: 7, level: 4 },
            { id: 8, level: 4 }, { id: 9, level: 4 },
            { id: 12, level: 4 }, { id: 14, level: 4 },
            { id: 15, level: 4 }, { id: 16, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    {
        name: 'Pawan Mandhan',
        empID: 682711,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'pawan.mandhan@soprasteria.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Abiram .',
        empID: 683079,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'abiram.abiram@soprasteria.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    {
        name: 'Aayush Rohila',
        empID: 682871,
        avatar: '',
        location: 1,
        desig: 'Junior Software Engineer',
        client: ['EPO'],
        email: 'aayush.rohila@soprasteria.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Adnan Khan',
        empID: 683542,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'adnan.khan@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    {
        name: 'Devesh Mishra',
        empID: 683555,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'devesh.mishra@soprasteria.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Harshit Tailang',
        empID: 686349,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'harshit.tailang@soprasteria.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    {
        name: 'Vishesh Kumar Gupta',
        empID: 670569,
        avatar: 'vkgupta.png',
        location: 1,
        desig: 'Test Consultant ',
        client: ['EPO'],
        email: 'vishesh-kumar.gupta@soprasteria.com',
        level: '5B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    }
];
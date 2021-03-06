var imagePath = './assets/images/emp-images/';
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

var supervisorData = {
    
};

var data = {
    608237: {
        name: 'Ratnesh Sharma',
        empID: 608237,
        avatar: '',
        location: 1,
        nucleus: true,
        desig: 'Delivery Manager - AM',
        client: ['EPO'],
        email: 'ratnesh.sharma@xxx.com',
        level: '5B',
        totalSupervisee: 16,
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    607462: {
        name: 'Anil Sharma',
        empID: 607462,
        avatar: '',
        location: 1,
        nucleus: true,
        desig: 'Project Manager',
        client: ['EPO'],
        email: 'anil.sharma@xxx.com',
        level: '5B',
        totalSupervisee: 12,
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    607377: {
        name: 'Nikhil Srivastava',
        empID: 607377,
        avatar: '',
        location: 1,
        nucleus: true,
        desig: 'Delivery Manager - AM',
        client: ['EPO'],
        email: 'nikhil.srivastava@xxx.com',
        level: '5B',
        totalSupervisee: 6,
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ] 
    },
    610120:{
        name: 'Vivek Govil',
        empID: 610120,
        avatar: '',
        location: 1,
        nucleus: true,
        desig: 'Delivery Manager - AM',
        client: ['EPO'],
        email: 'vivek.govil@xxx.com',
        level: '5B',
        totalSupervisee: 1,
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    613429:{
        name: 'Dinesh Aneja',
        empID: 613429,
        avatar: '',
        location: 1,
        nucleus: true,
        desig: 'Delivery Manager - AM',
        client: ['EPO'],
        email: 'dinesh.aneja@xxx.com',
        level: '5B',
        totalSupervisee: 1,
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    609869: {
        name: 'Gagandeep Singh',
        empID: 609869,
        avatar: '',
        location: 1,
        nucleus: true,
        desig: 'Service Manager',
        client: ['EPO'],
        email: 'gagandeep.singh9398@xxx.com',
        level: '5B',
        totalSupervisee: 4,
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    670569: {
        name: 'Vishesh Kumar Gupta',
        empID: 670569,
        avatar: '',
        location: 1,
        nucleus: true,
        desig: 'Business Consultant',
        client: ['EPO'],
        email: 'vishesh-kumar.gupta@xxx.com',
        level: '5B',
        totalSupervisee: 8,
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    680097: {
        name: 'Sandeep Sharma',
        empID: 680097,
        avatar: '',
        location: 1,
        nucleus: true,
        desig: 'Senior Technical Architect',
        client: ['EPO'],
        email: 'sandeep.sharma@xxx.com',
        level: '5B',
        totalSupervisee: 1,
        skill: [{ id: 1, level: 1 },
            { id: 17, level: 4 }
        ]
    },
    682143: {
        name: 'Subroto Mukherjee',
        empID: 682143,
        avatar: 'me.png',
        location: 1,
        nucleus: true,
        desig: 'Consulting Architect',
        client: ['EPO'],
        email: 'subroto.mukherjee@xxx.com',
        level: '5B',
        totalSupervisee: 1,
        skill: [{ id: 2, level: 4 }, { id: 3, level: 4 },
            { id: 4, level: 4 }, { id: 5, level: 4 },
            { id: 6, level: 4 }, { id: 7, level: 4 },
            { id: 8, level: 4 }, { id: 9, level: 4 },
            { id: 12, level: 4 }, { id: 14, level: 4 },
            { id: 15, level: 4 }, { id: 16, level: 4 },
            { id: 17, level: 4 }
        ]
    },
    672267: {
        name: 'Shikha Sharma',
        empID: 672267,
        avatar: '',
        location: 1,
        desig: 'Senior Test Analyst',
        client: ['EPO'],
        email: 'shikha.sharma@xxx.com',
        level: '6B',
        totalSupervisee: 7,
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    671244: {
        name: 'Swati Khullar',
        empID: 671244,
        avatar: '',
        location: 1,
        desig: 'Senior Test Analyst',
        client: ['EPO'],
        email: 'swati.khullar@xxx.com',
        level: '6B',
        totalSupervisee: 1,
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    608054: {
        name: 'Amit Gupta',
        empID: 608054,
        avatar: '',
        location: 1,
        desig: 'Delivery Manager - AM',
        client: ['EPO'],
        email: 'amit.gupta@xxx.com',
        level: '5B',
        totalSupervisee: 1,
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    609833: {
        name: 'Ashwarya Sharma',
        empID: 609833,
        avatar: '',
        location: 1,
        desig: 'Senior Test Analyst',
        client: ['EPO'],
        email: 'ashwarya.sharma@xxx.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    615605: {
        name: 'Preeti Bindal',
        empID: 615605,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'preeti.bindal@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    671735: {
        name: 'Bhakti Soni',
        empID: 671735,
        avatar: '',
        location: 1,
        desig: 'Senior Test Analyst',
        client: ['EPO'],
        email: 'bhakti.soni@xxx.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    644961: {
        name: 'Vineet Gupta',
        empID: 644961,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'vineet.gupta4961@xxx.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 609869
    },
    649959: {
        name: 'Ravinder Pratap Rana',
        empID: 649959,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'ravinder.rana@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    652379: {
        name: 'Shivangi Tripathi',
        empID: 652379,
        avatar: '',
        location: 1,
        desig: 'Junior Software Engineer',
        client: ['EPO'],
        email: 'shivangi.tripathi@xxx.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    655609: {
        name: 'Abhijit Panda',
        empID: 655609,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'abhijit.panda@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    655694: {
        name: 'Sahil Gupta',
        empID: 655694,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'sahil.gupta@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    657420: {
        name: 'Nidhi Jain',
        empID: 657420,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'nidhi.jain1@xxx.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    660003: {
        name: 'Zeeshan Waris',
        empID: 660003,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'zeeshan.waris@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    662775: {
        name: 'Saranjeet Kaur',
        empID: 662775,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'saranjeet.kaur@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    663428: {
        name: 'Shruti Jain',
        empID: 663428,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'shruti.jain2@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    611406: {
        name: 'Poonam Sabharwal',
        empID: 611406,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'poonam.sabharwal@xxx.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    673594: {
        name: 'Rashi Prakash',
        empID: 673594,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'rashi.prakash@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    674613: {
        name: 'Rupakshi Gupta',
        empID: 674613,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'rupakshi.gupta@xxx.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 671244
    },
    674972: {
        name: 'Deepanshu Garg',
        empID: 674972,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'deepanshu.garg@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    675877: {
        name: 'Pankaj Mukesh Sharma',
        empID: 675877,
        avatar: '',
        location: 1,
        desig: 'Junior Software Engineer',
        client: ['EPO'],
        email: 'deepanshu.garg@xxx.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    676746: {
        name: 'Monika Kapoor',
        empID: 676746,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'monika.kapoor@xxx.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    677842: {
        name: 'Nitin Sharma',
        empID: 677842,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'nitin.sharma@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 609869
    },
    677968: {
        name: 'Suraj Kumar Singh',
        empID: 677968,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'suraj.singh@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    677969: {
        name: 'Abhishek Kumar',
        empID: 677969,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'abhishek.kumar2@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    678151: {
        name: 'Amit Garg',
        empID: 678151,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'amit.garg@xxx.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    678272: {
        name: 'Dipanshu Asri',
        empID: 678272,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'dipanshu.asri@xxx.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 609869
    },
    678367: {
        name: 'Babloo Kumar',
        empID: 678367,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'babloo.kumar@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    678508: {
        name: 'Narotam Pal Singh',
        empID: 678508,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'narotam.singh@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    678605: {
        name: 'Maninder Singh Bali',
        empID: 678605,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'maninder.bali@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    678615: {
        name: 'Manoj Kumar',
        empID: 678615,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'manoj.kumar3@xxx.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    678664: {
        name: 'Sonu Kumar',
        empID: 678664,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'sonu.kumar@xxx.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    678815: {
        name: 'Gaurav Garg',
        empID: 678815,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'gaurav.garg3@xxx.com',
        level: '6A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    678906: {
        name: 'Vignesh Arivazhagan',
        empID: 678906,
        avatar: '',
        location: 3,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'vignesh.arivazhagan@xxx.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    678907: {
        name: 'Deepan Kiran Kumar Vadivel',
        empID: 678907,
        avatar: '',
        location: 3,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'deepan.vadivel@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    678956: {
        name: 'Kavita .',
        empID: 678956,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'kavita.kavita2@xxx.com',
        level: '6A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    679082: {
        name: 'Chandra Bahadur',
        empID: 679082,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'chandra.bahadur@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 609869
    },
    679168: {
        name: 'Sageer Ahmed',
        empID: 679168,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'sageer.ahmed@xxx.com',
        level: '6A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    679212: {
        name: 'Abhilash Tiwari',
        empID: 679212,
        avatar: '',
        location: 1,
        desig: 'Junior Test Analyst',
        client: ['EPO'],
        email: 'abhilash.tiwari@xxx.com',
        level: '8B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 672267
    },
    679215: {
        name: 'Vaibhav .',
        empID: 679215,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'vaibhav.vaibhav2@xxx.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    679265: {
        name: 'Gaurav Sinha',
        empID: 679265,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'gaurav.sinha@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    679378: {
        name: 'Himanshu Vashistha',
        empID: 679378,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'himanshu.vashistha@xxx.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    679423: {
        name: 'Vineet Raj',
        empID: 679423,
        avatar: '',
        location: 1,
        desig: 'Test Analyst',
        client: ['EPO'],
        email: 'vineet.raj@xxx.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 670569
    },
    679487: {
        name: 'Palvinder Singh',
        empID: 679487,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'palvinder.singh@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    679567: {
        name: 'Mohammad Jamshed Akhtar',
        empID: 679567,
        avatar: '',
        location: 1,
        desig: 'Senior Software Engineer',
        client: ['EPO'],
        email: 'mohammad.akhtar@xxx.com',
        level: '6B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    679657: {
        name: 'Mohammad Vaqas Azeem',
        empID: 679657,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'mohammad.azeem@xxx.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    680065: {
        name: 'Ashad Naseem',
        empID: 680065,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'ashad.naseem@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    680227: {
        name: 'Jitendra Singh Dhanagar',
        empID: 680227,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'jitendra.dhanagar@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    681379: {
        name: 'Ankit Jain',
        empID: 681379,
        avatar: '',
        location: 1,
        desig: 'Junior Software Engineer',
        client: ['EPO'],
        email: 'ankit.jain42@xxx.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608054
    },
    681432: {
        name: 'Rajat Arora',
        empID: 681432,
        avatar: '',
        location: 1,
        desig: 'Junior Software Engineer',
        client: ['EPO'],
        email: 'rajat.arora@xxx.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    682711: {
        name: 'Pawan Mandhan',
        empID: 682711,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'pawan.mandhan@xxx.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    683079: {
        name: 'Abiram .',
        empID: 683079,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'abiram.abiram@xxx.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607462
    },
    682871: {
        name: 'Aayush Rohila',
        empID: 682871,
        avatar: '',
        location: 1,
        desig: 'Junior Software Engineer',
        client: ['EPO'],
        email: 'aayush.rohila@xxx.com',
        level: '8A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    683542: {
        name: 'Adnan Khan',
        empID: 683542,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'adnan.khan@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 607377
    },
    683555: {
        name: 'Devesh Mishra',
        empID: 683555,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'devesh.mishra@xxx.com',
        level: '7A',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    },
    686349: {
        name: 'Harshit Tailang',
        empID: 686349,
        avatar: '',
        location: 1,
        desig: 'Software Engineer',
        client: ['EPO'],
        email: 'harshit.tailang@xxx.com',
        level: '7B',
        skill: [{ id: 1, level: 4 },
            { id: 17, level: 4 }
        ],
        supervisor: 608237
    }
};
var imagePath = './assets/images/emp-images/';
var skillData = {
    1: { skill: 'Project Management', color: '#FFBA08' },
    2: { skill: 'HTML', color: '#FCA311' },
    3: { skill: 'JS', color: '#A2AEBB' },
    4: { skill: 'CSS', color: '#3F88C5' },
    5: { skill: 'Angular', color: '#1C3144' },
    6: { skill: 'React', color: '#F5D0C5' },
    7: { skill: 'Typescript', color: '#D69F7E' },
    8: { skill: 'Node.js', color: '#774936' },
    9: { skill: 'Build Tools', color: '#3C0000' },
    10: { skill: 'JAVA', color: '#CBEAA6' },
    11: { skill: 'Spring MVC', color: '#C0D684' },
    12: { skill: 'ES6', color: '#F3F9D2' },
    13: { skill: 'SQL', color: '#3D0B37' },
    14: { skill: 'MVC', color: '#63264A' },
    15: { skill: 'Singleton', color: '#C7EDE4' },
    16: { skill: 'RxJS', color: '#AF9AB2' },
    17: { skill: 'Agile', color: '#820B8A' }
};

var levelData = {
    1: { level: 'Beginner', color: '#672A4E' },
    2: { level: 'Intermediate', color: '#FF0000' },
    3: { level: 'Advanced', color: '#507DBC' },
    4: { level: 'Expert', color: '#006992' }
};

var locationData = {
    1: { location: 'Noida Site 3 Unit 1', color: '#14213D' },
    2: { location: 'Noida Site 1', color: '#A9C5A0' },
    3: { location: 'Chennai', color: '#C6DEC6' }
};
var data = {
    607457: {
        name: 'Arun Anand',
        empID: 607457,
        avatar: '',
        location: 1,
        desig: 'Senior Delivery Manager',
        client: ['EPO'],
        email: 'nikhil.srivastava@soprasteria.com',
        level: '4B',
        totalSupervisee: 5,
        skill: [{ id: 1, level: 2 },
        { id: 17, level: 4 }
        ]
    },
    163347: {
        name: 'Ratnesh Sharma',
        empID: 163347,
        avatar: '',
        location: 1,
        desig: 'Project Manager',
        level: '5B',
        skill: [{ id: 1, level: 4 },
        { id: 17, level: 4 }
        ],
        supervisor: 607457
    },
    163348: {
        name: 'Anil Sharma',
        empID: 163348,
        avatar: '',
        location: 1,
        desig: 'Project Manager',
        level: '5B',
        skill: [{ id: 1, level: 4 },
        { id: 17, level: 4 }
        ],
        supervisor: 607457
    },
    163349: {
        name: 'Nikhil Srivastava',
        empID: 163349,
        avatar: '',
        location: 1,
        desig: 'Project Manager',
        level: '5B',
        skill: [{ id: 1, level: 4 },
        { id: 17, level: 4 }
        ],
        supervisor: 607457
    },
    163350: {
        name: 'Vivek Govil',
        empID: 163350,
        avatar: '',
        location: 1,
        desig: 'Project Manager',
        level: '5B',
        skill: [{ id: 1, level: 4 },
        { id: 17, level: 4 }
        ],
        supervisor: 607457
    },
    682143: {
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
        { id: 12, level: 4 }, { id: 14, level: 2 },
        { id: 15, level: 4 }, { id: 16, level: 4 },
        { id: 17, level: 4 }
        ],
        supervisor: 607457
    }

};
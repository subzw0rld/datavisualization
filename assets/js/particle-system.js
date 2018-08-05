var ox = window.innerWidth/2, oy = window.innerHeight/2;
var obitalDistance = 150;
var differential = 5;
var speed = 0.005;
var startTime;
var config = {
    "4A": 50,
    "4B": 45,
    "5A": 40,
    "5B": 35,
    "6A": 30,
    "6B": 25,
    "7A": 20,
    "7B": 15,
    "8A": 10,
    "8B": 5
};


var dataModel = function() {
    var parsedData = Object.assign(data);
    var i = 0, j = 0;

    for(i = 0; i < parsedData.length; i++) {
        var skillArr = [];
        parsedData[i].location = locationData[parsedData[i].location];
        for(j = 0; j < parsedData[i].skill.length; j++) {
            var id = parsedData[i].skill[j].id;
            var level = parsedData[i].skill[j].level;
            var obj = {skill: skillData[id], level: levelData[level]};
            skillArr.push(obj);
        }
        parsedData[i].skill = skillArr;
    }
    console.log(parsedData);
    return parsedData;
};

var dataUtil = {
    getEmpByID: function(id, dataSource) {
        for(var i=0; i < dataSource.length; i++) {
            var obj = dataSource[i];
            if (id === obj.empID) {
                return obj;
            }
        }
    }
}

function ParticleSystem() {};

ParticleSystem.prototype.init = function () {
    this.particleCanvas = document.getElementById('particleContainer');
    this.context = this.particleCanvas.getContext('2d');
    this.particleCanvas.setAttribute('width', window.innerWidth);
    this.particleCanvas.setAttribute('height', window.innerHeight);
    this.data = dataModel();
    this.subtendedAngle = 360/(this.data.length-1);//<--Subtracting 1 as there always be one at the top level
    this.theta = (this.subtendedAngle * Math.PI)/180;
};

ParticleSystem.prototype.drawParticle = function () {
    var self = this;
    var startAngle = 0;
    var totalSkillData, locationData;
    var i = 0, j = 0;
    
    for(i = 0; i < this.data.length; i++) {
        var obj = this.data[i];
        // var theta=(Math.PI*this.subtendedAngle)/180*i;
        var x;
        var y;
        var superVisor = dataUtil.getEmpByID(obj.supervisor, this.data);

        if(!superVisor) {
            x = ox;
            y = oy;
        }else {
            x = ox + (Math.cos(this.theta*i)*obitalDistance);
            y = oy + (Math.sin(this.theta*i)*obitalDistance);
        }

        var radius = config[obj.level];

        //Draw the nuclei fill (center portion)
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI*2);
        this.context.closePath();
        this.context.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.context.fill();

        //Draw the location band
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI*2, true);
        this.context.arc(x, y, radius-10, Math.PI*2, 0, false);
        this.context.closePath();
        this.context.fillStyle = obj.location.color;
        this.context.fill();

        for (j = 0; j < obj.skill.length; j++) {
            var skillObj = obj.skill[j];
            // console.log(skillObj);
            var startRadian=(startAngle+(Math.PI*2)/obj.skill.length)*j;
            var endRadian = ((Math.PI*2)/obj.skill.length)*(j+1);
            //Drawing the Skill based arcs here
            this.context.beginPath();
            this.context.arc(x, y, radius+10, startRadian, endRadian, false);
            this.context.arc(x, y, radius, endRadian, startRadian, true);
            this.context.closePath();
            this.context.fillStyle = skillObj.skill.color;
            this.context.fill();
            //Drawing the Level based arcs here
            this.context.beginPath();
            this.context.arc(x, y, radius+20, startRadian, endRadian, false);
            this.context.arc(x, y, radius+10, endRadian, startRadian, true);
            this.context.closePath();
            this.context.fillStyle = skillObj.level.color;
            this.context.fill();
        }
        
    }
    
};

ParticleSystem.prototype.animate = function() {
    var movement = Math.random()*differential;
    
    this.theta+=speed;
    // this.subtendedAngle+=speed;
    if (ox > window.innerWidth && oy > window.innerHeight) {
        ox -= movement;
        oy -= movement;
    }else if (ox <=0 && oy <= 0) {
        ox += movement;
        oy += movement;
    }
    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.drawParticle();
};


var particleSystem = new ParticleSystem();

particleSystem.init();
particleSystem.drawParticle();

function step(time) {
    if(!startTime) startTime = time;
    var currentTime = time - startTime;
    if(currentTime >= 500) {
        particleSystem.animate();
    }
    window.requestAnimationFrame(step);
}

window.requestAnimationFrame(step);
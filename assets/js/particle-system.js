var particleWrapper = Util.documentSelector('.particleWrapper');
var particleInfoContainer = Util.documentSelector('.particle-info-container');
var particleInfoName = Util.documentSelector('.info-name');
var particleInfoTitle = Util.documentSelector('.info-title');
var particleInfoLevel = Util.documentSelector('.info-level');
var particleInfoLocation = Util.documentSelector('.info-location');
var particleInfoAvatar = Util.documentSelector('.particle-avatar > img');
var particleInfoCloseIcon = Util.documentSelector('.close-icon');
var ox = window.innerWidth / 2, oy = window.innerHeight / 2;
var obitalDistance = 150;
var differential = Util.getRandom(-5, 5);
var speed = 0.005;
var startTime;
var firstRun = true;
var mouseX, mouseY;
var coordsArr=[];
var selectedParticleIndex;
var config = {
    "4A": 60,
    "4B": 55,
    "5A": 50,
    "5B": 45,
    "6A": 40,
    "6B": 35,
    "7A": 30,
    "7B": 25,
    "8A": 20,
    "8B": 15
};

particleInfoCloseIcon.addEventListener('click', function(e) {
    particleInfoContainer.classList.remove('show');
});

var dataModel = function () {
    var parsedData = Object.assign(data);
    var i = 0, j = 0;
    // var coordArr = [];

    for (i = 0; i < parsedData.length; i++) {
        var skillArr = [];
        var img = new Image(60, 60);
        parsedData[i].location = locationData[parsedData[i].location];
        // coordArr.push(obitalDistance + 1.5 * (Math.random() * obitalDistance));
        if(parsedData[i].avatar.length > 0) {
            img.src = imagePath + parsedData[i].avatar;
        }else {
            img.src = imagePath + "avatar.png";
        }
        parsedData[i].avatarImg = img;
        for (j = 0; j < parsedData[i].skill.length; j++) {
            var id = parsedData[i].skill[j].id;
            var level = parsedData[i].skill[j].level;
            var obj = { skill: skillData[id], level: levelData[level] };
            skillArr.push(obj);
        }
        parsedData[i].skill = skillArr;
    }
    
    return parsedData;
};

function ParticleSystem() { };

ParticleSystem.prototype.init = function () {
    this.particleCanvas = document.getElementById('particleContainer');
    this.context = this.particleCanvas.getContext('2d');
    this.particleCanvas.setAttribute('width', window.innerWidth);
    this.particleCanvas.setAttribute('height', window.innerHeight);
    this.data = dataModel();
    this.subtendedAngle = 360 / (this.data.length - 1);//<--Subtracting 1 as there always be one at the top level
    this.theta = (this.subtendedAngle * Math.PI) / 180;
    this.thetaArr=[];
    this.superVisorParticle=[];
    this.superVisorCount = 0;
    
    for(var i=0; i < this.data.length; i++) {
        var supervisorData = dataUtil.getEmpByID(this.data[i].supervisor, this.data);
        var obj={};
        if(!supervisorData) {
            obj.id = this.data[i].empID;
            obj.x = Util.getRandom(0, 1000);
            obj.y = Util.getRandom(50, 900);
            this.superVisorParticle.push(obj);
        }
    }
    // console.info(this.superVisorParticle);
    // console.info(Util.getRandomUniqueValues(this.data.length, window.innerWidth));
};

ParticleSystem.prototype.getNucleusInfo = function(id) {
    var obj;
    for(var i=0; i<this.superVisorParticle.length; i++) {
        var obj = this.superVisorParticle[i];
        if(obj.id === id) {
            break;
        }
    }

    return obj;
}

ParticleSystem.prototype.drawParticle = function () {
    var self = this;
    var startAngle = 0;
    var totalSkillData, locationData;
    var i = 0, j = 0;
    this.superVisorCount = 0;
    for (i = 0; i < this.data.length; i++) {
        var obj = this.data[i];
        var x;
        var y;
        var superVisor = dataUtil.getEmpByID(obj.supervisor, this.data);
        var radius = config[obj.level];

        if(firstRun) {
            this.thetaArr.push(this.theta*i);
        }else {
            this.thetaArr[i] +=speed;
        }

        if (!superVisor) {
            ox = this.superVisorParticle[this.superVisorCount].x;
            oy = this.superVisorParticle[this.superVisorCount].y;
            x = ox;
            y = oy;
            this.superVisorCount++;
        } else {
            // console.info(this.getNucleusInfo(obj.supervisor).id);
            ox = this.getNucleusInfo(obj.supervisor).x;
            oy = this.getNucleusInfo(obj.supervisor).y;
            if (firstRun) {
                x = ox + (Math.cos(this.theta * i) * obitalDistance);
                y = oy + (Math.sin(this.theta * i) * obitalDistance);
            }else {
                x = ox + (Math.cos(this.thetaArr[i]) * obitalDistance);
                y = oy + (Math.sin(this.thetaArr[i]) * obitalDistance);
            }
        }
        if(coordsArr.length < this.data.length) {
            coordsArr.push({x: x, y: y, radius: radius});
        }else {
            coordsArr[i].x = x;
            coordsArr[i].y = y;
        }
        //Draw the nuclei fill (center portion)
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        this.context.closePath();
        this.context.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.context.fill();
        //Add the avatar
        console.info(this.data[i].avatarImg, this.data[i].avatarImg.width);
        this.context.drawImage(this.data[i].avatarImg, x - this.data[i].avatarImg.width/2, y-this.data[i].avatarImg.height/2);
        
        //Draw the location band
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI * 2, true);
        this.context.arc(x, y, radius - 7, Math.PI * 2, 0, false);
        this.context.closePath();
        this.context.fillStyle = obj.location.color;
        this.context.fill();

        for (j = 0; j < obj.skill.length; j++) {
            var skillObj = obj.skill[j];
            var startRadian = (startAngle + (Math.PI * 2) / obj.skill.length) * j;
            var endRadian = ((Math.PI * 2) / obj.skill.length) * (j + 1);
            //Drawing the Skill based arcs here
            this.context.beginPath();
            this.context.arc(x, y, radius + 7, startRadian, endRadian, false);
            this.context.arc(x, y, radius, endRadian, startRadian, true);
            this.context.closePath();
            this.context.fillStyle = skillObj.skill.color;
            this.context.fill();
            //Drawing the Level based arcs here
            this.context.beginPath();
            this.context.arc(x, y, radius + 15, startRadian, endRadian, false);
            this.context.arc(x, y, radius + 7, endRadian, startRadian, true);
            this.context.closePath();
            this.context.fillStyle = skillObj.level.color;
            this.context.fill();
        }

    }
    firstRun = false;

};

ParticleSystem.prototype.animate = function () {
    var movement = differential/this.data.length;
    // ox += movement;
    // oy += movement;

    for(var i=0; i < this.superVisorParticle.length; i++) {
        var obj = this.superVisorParticle[i];
        obj.x +=movement;
        obj.y +=movement;

        if(obj.x > (window.innerWidth + obitalDistance)) {
            obj.x = 0;
        }
        if(obj.x < 0) {
            obj.x = window.innerWidth;
        }

        if(obj.y > (window.innerHeight + obitalDistance)) {
            obj.y = 0;
        }
        if(obj.y < 0) {
            obj.y = window.innerHeight;
        }
    }

    
    // if (ox > (window.innerWidth + obitalDistance)) {
    //     ox = 0;
    // }
    // if (oy > (window.innerHeight+obitalDistance)) {
    //     oy = 0;
    // }
    // if (ox < 0) {
    //     ox = window.innerWidth;
    // }
    // if (oy < 0) {
    //     oy = window.innerHeight;
    // }

    this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.drawParticle();
};


var particleSystem = new ParticleSystem();

particleSystem.init();
particleSystem.drawParticle();

function step(time) {
    if (!startTime) startTime = time;
    var currentTime = time - startTime;
    if (currentTime >= 500) {
        particleSystem.animate();
    }
    window.requestAnimationFrame(step);
}

window.requestAnimationFrame(step);
// console.info(differential);
document.getElementById('particleContainer').addEventListener("click", function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    for(var i=0; i< coordsArr.length; i++) {
        var result = Math.sqrt((mouseX - coordsArr[i].x)*(mouseX - coordsArr[i].x) + (mouseY - coordsArr[i].y)*(mouseY - coordsArr[i].y));
        if(result <= coordsArr[i].radius) {
            particleInfoName.textContent = particleSystem.data[i].name;
            particleInfoTitle.textContent = particleSystem.data[i].desig;
            particleInfoLevel.textContent = particleSystem.data[i].level;
            particleInfoLocation.textContent = particleSystem.data[i].location.location;
            particleInfoAvatar.setAttribute('src', particleSystem.data[i].avatarImg.src);
            particleInfoContainer.classList.add('show');
        }
    }
});
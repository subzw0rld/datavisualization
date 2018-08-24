/***********HTML elements *************/
var particleWrapper = Util.documentSelector('.particleWrapper');
var particleInfoContainer = Util.documentSelector('.particle-info-container');
var particleInfoName = Util.documentSelector('.info-name');
var particleInfoTitle = Util.documentSelector('.info-title');
var particleInfoLevel = Util.documentSelector('.info-level');
var particleInfoLocation = Util.documentSelector('.info-location');
var particleInfoSupervisor = Util.documentSelector('.info-supervisor');
var particleInfoSupervisee = Util.documentSelector('.info-supervisee');
var particleInfoAvatar = Util.documentSelector('.particle-avatar > img');
var particleInfoCloseIcon = Util.documentSelector('.close-icon');
/***********HTML elements *************/

//Animation effects
var pulseRadiusIncrement = 0;
var particleSelected;
var beatRadius = 0;
var beatCount = 0;
var beatDirection = 'grow';
var speed = 0.005;
var startTime;
var firstRun = true;
var mouseX, mouseY;
var coordsArr = [];
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

var obitalDistance = {
    "5B": 400,
    "6A": 300,
    "6B": 300,
    "7A": 200,
    "7B": 200,
    "8A": 120,
    "8B": 120
};

particleInfoCloseIcon.addEventListener('click', function (e) {
    particleInfoContainer.classList.remove('show');
});

var dataModel = function () {
    var particleData = Object.assign(data);
    var i = 0, j = 0;

    for (var item in particleData) {
        var skillArr = [];
        var img = new Image(60, 60), angle;
        var obj = particleData[item];
        obj.location = locationData[obj.location];

        if (!obj.supervisor) {
            obj.x = Util.getRandom(100, window.innerWidth - 100);
            obj.y = Util.getRandom(100, window.innerHeight - 100);
            obj.direction = Util.getRandom(-5, 5);
            obj.movement = obj.direction / obj.totalSupervisee;
            if (obj.movement === 0) {
                obj.movement = Math.round(Math.random() * 6) / obj.totalSupervisee;
            }
            obj.childAttached = 0;
        }
        if (obj.supervisor && obj.totalSupervisee) {
            obj.childAttached = 0;
        }
        if (obj.totalSupervisee) {
            angle = Math.round(360 / obj.totalSupervisee);
            obj.theta = (angle * Math.PI) / 180;
        }

        if (obj.avatar.length > 0) {
            img.src = imagePath + obj.avatar;
        } else {
            img.src = imagePath + "avatar.png";
        }
        obj.avatarImg = img;
        for (j = 0; j < obj.skill.length; j++) {
            var id = obj.skill[j].id;
            var level = obj.skill[j].level;
            var skillDataObj = { skill: skillData[id], level: levelData[level] };
            skillArr.push(skillDataObj);
        }
        obj.skill = skillArr;
    }

    for (var item in particleData) {
        var obj = particleData[item];
        var nucleus;
        if (obj.supervisor) {
            nucleus = particleData[obj.supervisor];
            obj.index = nucleus.childAttached;
            nucleus.childAttached++;
        }
    }

    return particleData;
};

function ParticleSystem() { };

ParticleSystem.prototype.init = function () {
    this.particleCanvas = document.getElementById('particleContainer');
    this.context = this.particleCanvas.getContext('2d');
    this.particleCanvas.setAttribute('width', window.innerWidth);
    this.particleCanvas.setAttribute('height', window.innerHeight);
    this.data = dataModel();
    this.thetaArr = {};
    this.superVisorParticle = [];
    this.superVisorCount = 0;
    // console.info(this.data);
};

ParticleSystem.prototype.drawParticle = function () {
    var self = this;
    var startAngle = 0, pulseStartRadian = 0, pulseEndRadian = 2*(Math.PI);
    var totalSkillData, locationData, pulseOuterRadius, pulseInnerRadius;
    var j = 0;
    var index = 0;
    var nucleus;

    for (var item in this.data) {
        var obj = this.data[item];
        var radius = config[obj.level];
        var x, y;
        if (!obj.supervisor) {
            x = obj.x;
            y = obj.y;
        } else {
            nucleus = this.data[obj.supervisor];
            if (firstRun) {
                x = nucleus.x + (Math.cos(nucleus.theta * obj.index) * (obitalDistance[obj.level]));
                y = nucleus.y + (Math.sin(nucleus.theta * obj.index) * (obitalDistance[obj.level]));
                this.thetaArr[obj.empID] = nucleus.theta * obj.index;
            } else {
                x = nucleus.x + (Math.cos(this.thetaArr[obj.empID]) * (obitalDistance[obj.level]));
                y = nucleus.y + (Math.sin(this.thetaArr[obj.empID]) * (obitalDistance[obj.level]));
            }

            this.context.beginPath();
            this.context.moveTo(x, y);
            this.context.lineTo(nucleus.x, nucleus.y);
            this.context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.context.stroke();
            this.context.closePath();
        }

        obj.x = x;
        obj.y = y;

        if(particleSelected === obj.empID && beatCount <= 30) {
            beatCount++;
            if(beatRadius <= 10 && beatDirection === 'grow') {
                beatRadius++;
                if(beatRadius >= 10) {
                    beatDirection = 'shrink';
                }
            }else {
                if(beatRadius <= 0) {
                    beatDirection = 'grow';
                }

                beatRadius--;
            }
            radius = radius + beatRadius;
        }

        if(beatCount >= 30){ 
            particleSelected = {};
            beatRadius = 0;
            beatCount = 0;
        }

        // Draw the nuclei fill(center portion)
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        this.context.closePath();
        this.context.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.context.fill();
        //Add the avatar
        this.context.drawImage(obj.avatarImg, x - obj.avatarImg.width / 2, y - obj.avatarImg.height / 2);
        //Draw the location band
        this.context.beginPath();
        this.context.arc(x, y, radius + 7, 0, Math.PI * 2, true);
        this.context.arc(x, y, radius, Math.PI * 2, 0, false);
        this.context.closePath();
        this.context.fillStyle = obj.location.color;
        this.context.fill();

        for (j = 0; j < obj.skill.length; j++) {
            var skillObj = obj.skill[j];
            var startRadian = (startAngle + (Math.PI * 2) / obj.skill.length) * j;
            var endRadian = ((Math.PI * 2) / obj.skill.length) * (j + 1);
            //Drawing the Skill based arcs here
            this.context.beginPath();
            this.context.arc(x, y, radius + 14, startRadian, endRadian, false);
            this.context.arc(x, y, radius + 7, endRadian, startRadian, true);
            this.context.closePath();
            this.context.fillStyle = skillObj.skill.color;
            this.context.fill();
            //Drawing the Level based arcs here
            this.context.beginPath();
            this.context.arc(x, y, radius + 21, startRadian, endRadian, false);
            this.context.arc(x, y, radius + 14, endRadian, startRadian, true);
            this.context.closePath();
            this.context.fillStyle = skillObj.level.color;
            this.context.fill();
        }

        this.thetaArr[obj.empID] += speed;
    }
    firstRun = false;
};

ParticleSystem.prototype.animate = function () {
    for (var item in this.data) {
        var obj = this.data[item];

        if (obj.nucleus) {
            obj.x += obj.movement;
            obj.y += obj.movement;
            if (obj.x >= window.innerWidth) {
                obj.x = 0;
            }
            if (obj.x < 0) {
                obj.x = window.innerWidth;
            }

            if (obj.y > (window.innerHeight)) {
                obj.x = window.innerWidth - (window.innerWidth - obj.x);
                obj.y = 0;
            }
            if (obj.y < 0) {
                obj.x = window.innerWidth - (window.innerWidth - obj.x);
                obj.y = window.innerHeight;
            }
        }
    }
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

document.getElementById('particleContainer').addEventListener("click", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    for (var item in particleSystem.data) {
        var obj = particleSystem.data[item];
        var result = Math.sqrt((mouseX - obj.x) * (mouseX - obj.x) + (mouseY - obj.y) * (mouseY - obj.y));
        var radius = config[obj.level];

        if (result <= radius) {
            var supervisor = particleSystem.data[obj.supervisor];
            particleSelected = obj.empID;
            particleInfoName.textContent = obj.name;
            particleInfoTitle.textContent = obj.desig;
            particleInfoLevel.textContent = obj.level;
            particleInfoLocation.textContent = obj.location.location;
            
            if (supervisor) {
                // console.info(particleInfoSupervisor.parentElement);
                particleInfoSupervisor.parentElement.classList.remove("hide")
                particleInfoSupervisor.textContent = supervisor.name;
            } else {
                if (!particleInfoSupervisor.parentElement.classList.contains("hide")) {
                    particleInfoSupervisor.parentElement.classList.add("hide");
                }
            }
            if (obj.totalSupervisee) {
                particleInfoSupervisee.parentElement.classList.remove("hide");
                particleInfoSupervisee.textContent = obj.totalSupervisee;
            } else {
                if (!particleInfoSupervisee.parentElement.classList.contains("hide")) {
                    particleInfoSupervisee.parentElement.classList.add("hide");
                }
            }
            particleInfoAvatar.setAttribute('src', obj.avatarImg.src);
            particleInfoContainer.classList.add('show');
        }
    }
});
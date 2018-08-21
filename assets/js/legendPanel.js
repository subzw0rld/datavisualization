var togglePanel = Util.documentSelector('.toggle-panel');
var toggleIcon = Util.documentSelector('.toggle-panel > .toggle-icon');
var legendPanel = Util.documentSelector('.legend-panel');


(function() {
    var skillList = document.querySelector(".skill-list");
    var levelList = document.querySelector(".level-list");
    var locationList = document.querySelector(".location-list");
    for(var item in skillData) {
        // console.info(skillData[item]);
        var obj = skillData[item];
        var li = document.createElement("li");
        li.innerHTML = "<span class="+'color-box'+" style="+'background-color:'+skillData[item].color+";"+"></span><span>"+skillData[item].skill+"</span>";
        skillList.appendChild(li);
    }

    for(var item in levelData) {
        var obj = levelData[item];
        var li = document.createElement("li");
        li.innerHTML = "<span class="+'color-box'+" style="+'background-color:'+levelData[item].color+";"+"></span><span>"+levelData[item].level+"</span>";
        levelList.appendChild(li);
    }

    for(var item in locationData) {
        var obj = locationData[item];
        var li = document.createElement("li");
        li.innerHTML = "<span class="+'color-box'+" style="+'background-color:'+locationData[item].color+";"+"></span><span>"+locationData[item].location+"</span>";
        locationList.appendChild(li);
    }
}());

togglePanel.addEventListener('click', function(e) {
    toggleIcon.classList.toggle('slide-in');
    legendPanel.classList.toggle('slide-in');
    particleWrapper.classList.toggle('slide-in');
});
var togglePanel=Util.documentSelector(".toggle-panel"),toggleIcon=Util.documentSelector(".toggle-panel > .toggle-icon"),legendPanel=Util.documentSelector(".legend-panel");(function(){var l=document.querySelector(".skill-list"),e=document.querySelector(".level-list"),a=document.querySelector(".location-list");for(var o in skillData){var n=(skillData[o],document.createElement("li"));n.innerHTML="<span class=color-box style=background-color:"+skillData[o].color+";></span><span>"+skillData[o].skill+"</span>",l.appendChild(n)}for(var o in levelData){var n=(levelData[o],document.createElement("li"));n.innerHTML="<span class=color-box style=background-color:"+levelData[o].color+";></span><span>"+levelData[o].level+"</span>",e.appendChild(n)}for(var o in locationData){var n=(locationData[o],document.createElement("li"));n.innerHTML="<span class=color-box style=background-color:"+locationData[o].color+";></span><span>"+locationData[o].location+"</span>",a.appendChild(n)}})(),togglePanel.addEventListener("click",function(l){toggleIcon.classList.toggle("slide-in"),legendPanel.classList.toggle("slide-in"),particleWrapper.classList.toggle("slide-in")});
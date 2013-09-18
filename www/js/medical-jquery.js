function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function getCurrentLocation() {
	//handleCurrentPosition({coords: {longitude:35.217254, latitude: 31.780496}})
	//handleNoGeo();
	//return
	if (navigator.geolocation)
    {
		navigator.geolocation.getCurrentPosition(handleCurrentPosition,handleNoGeo);
    }
	else {
		handleNoGeo();
	}
}

function prepareData() {
	function processMedicalCenter(idx,obj) {
	return;
		var id = idx;
		var latLng = new google.maps.LatLng(obj.location.lat,obj.location.lon);
		var marker = new google.maps.Marker({
			position: latLng,
			map: map,
			title: obj.name
		});
		var infowindow = new google.maps.InfoWindow({
			content: '<div>'+obj.name+'</div><br/><div>'+obj.address+'</div>'
		});
		google.maps.event.addListener(marker, 'click', function() {
			if (typeof openInfoWindow !== 'undefined') openInfoWindow.close();
			openInfoWindow = infowindow;
			infowindow.open(map,marker);
		});
		medicalCentersList[idx] = obj
		obj.id = id
		obj.latLng = latLng
		obj.marker = marker
		obj.infowindow = infowindow
	}
	
	medicalCentersList = []
	$.each(medicalCentresData,processMedicalCenter)
	/*$.getJSON("data/medicalCenters.json",function(medicalCenters) {
		$.each(medicalCenters,processMedicalCenter)
	});
	*/
}
var medicalCentersDistances = []
function updateMedicalCentersDistances() {
	medicalCentersDistances = []
	$.each(medicalCentresData, function(idx, obj){
		var distance = getDistanceFromLatLonInKm(myPos.lat(), myPos.lng(), obj.location.lat, obj.location.lon);
		medicalCentersDistances.push({id: obj.id, distance: distance})
	});
	/*
	medicalCentersList.sort(function(a,b) {
		return (a.distance < b.distance) ? -1 : 1
	});*/
}
/*
function populateAreaList() {
	var areas = medicalCentersList.map(function(obj) { return obj.area })
	x = areas
	var distinctAreas = areas.filter(function(itm,i,areas){
		return i==areas.indexOf(itm);
	});
	$.each(distinctAreas,function(idx, area) {
		$('#areaSelector').append('<option value="'+area+'">'+area+'</option>')
	})
}*/

var medicalCentersScroll;
var map;
$(document).ready(function() {

	$("#centerDetails").on("pageshow", function onPageShow(e,data) {
		displayMedicalCenterById(localStorage.getItem("centerId"));
	});
	$("#chooseCenter").on("pageshow", function onPageShow(e,data) {
		var centerType = localStorage.getItem("centerType")
		$("#centerTypeTitle").html(centerType)
		$('#areaSelector').trigger('change');
	});
	$("#typesList a").on("click", function(event) {
		localStorage.setItem("centerType",$(this).attr("center-type"));
		$("#centersList").html("")
	});
	$('#map_canvas').gmap({'center': new google.maps.LatLng(31.780496,35.217254), 'zoom': 18, 'disableDefaultUI':true, 'callback': function() {
						map = this;
						var self = this;
						self.addMarker({'position': this.get('map').getCenter() }).click(function() {
							self.openInfoWindow({ 'content': 'You are here!' }, this);
						});
					}}); 
	//window.setTimeout(function() {medicalCentersScroll = new iScroll('medicalCenters-wrapper');},100);
    /*var mapOptions = {
    zoom: 18,
    center: new google.maps.LatLng(31.780496,35.217254),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	*/
	prepareData();
//	populateAreaList();
	/*
	$('input[name=searchBy]:radio').change(function () {

		$("#medicalCenters").html("")
		var chosenSearchBy = $('input[name=searchBy]:radio:checked').val()
		if (chosenSearchBy === 'byArea') {
			$('#byArea').siblings().hide()
			$('#byArea').show()
			$('#areaSelector').trigger('change');
		}
		else {
			$('#nearest').siblings().hide()
			$('#nearest').show()
			if (typeof myPos === 'undefined') {
				$('#nearest').html("Unable to find your location! Please search by area.")
			}
			else {
				$('#nearest').html("Showing the 10 medical centers nearest to "+"<a href='javascript:jumpToMyLocation()'>you</a>")
				displayMedicalCenters(10,function(medicalCenter) {
					return true;
				});
			}
		}
	})*/
	$("#areaSelector").change(function () {
		$("#noListMessage").hide();
		var area = $("#areaSelector option:selected").val();
		console.log("Area chosen:"+area);
		var centerType = localStorage.getItem("centerType");
		displayMedicalCenters(9999,function(medicalCenter) {
			var filterByType = centerType === medicalCenter.centreType
			if (area === "All" || area === "Nearby") return filterByType;
			else return filterByType && medicalCenter.area === area;
		});		
	});
	getCurrentLocation();
})

function parsePhoneNumber(phoneNum) {
	return phoneNum.replace(/-/g,'')
}
function displayMedicalCenters(maxToDisplay, filterFunction) {
	var str = ""
	//sort them by distance, or else by name
	medicalCentresData.sort(function(a,b) {
		if (medicalCentersDistances.length > 0) return (getDistance(a.id) < getDistance(b.id)) ? -1 : 1
		else return (a.name < b.name) ? -1 : 1
	})
	var numCenters = 0
	$.each(medicalCentresData, function(idx, obj){ 
		if (idx <= maxToDisplay) {
			if(filterFunction(obj)) {
				str += displayMedicalCenterInList(obj);
				numCenters +=1;
			}
		}
	});
	if (numCenters == 0 ) $("#noListMessage").show();
	$("#centersList").html(str)
	$("#centersList").listview("refresh")
	$("#centersList").children("li").on("click", function() {
		console.log($(this))
		localStorage.setItem("centerId",$(this).attr("center-id"));
	});
}

function displayMedicalCenterById(id) {
	console.log(id)
	var medicalCenters = $.grep(medicalCentresData, function(obj,idx){ 
		return (obj.id === id)
	});
	if (medicalCenters.length != 1) {
		alert("Medical Center "+id+" not found");
		return;
	}
	var medicalCenter = medicalCenters[0];
	displayMedicalCenterDetails(medicalCenter)
	//$("#centerName").html(id)
			
}
function displayMedicalCenterDetails(obj) {
	$("#centerType").html(obj.centreType)
	$("#centerNameTitle").html(obj.name)
	$("#centerName").html(obj.name)
	var address = obj.address;
	var distance = getDistance(obj.id)
	if (distance !== null) {
		distance = " ("+distance.toFixed(2)+"km away)";
	}
	/*if (obj.location.lat !== 0) {
		//address += " (<a href='waze://?ll="+obj.location.lat+","+obj.location.lon+"' target='_blank'>Open in Waze</a>)";
		address += " (<a href='javascript:launchWaze("+obj.location.lat+","+obj.location.lon+")' target='_blank'>Open in Waze</a>)";
		}*/
	$("#centerAddress").html(address)
	$("#centerDistance").html(distance)
	var phoneNumbers = ""
	$.each(obj.phoneNumbers, function(idx,phoneNumber) {
		phoneNumbers +="<p><a href='tel:"+parsePhoneNumber(phoneNumber.number)+"'>"+phoneNumber.number+"</a></p>"
	});
	$("#centerPhoneNumbers").html(phoneNumbers)
	var openingHours = "<table class='table-stripe rounded-corners'><tbody>"
	$.each(obj.openingHours, function(idx,line) {
		openingHours +="<tr>";
		var d_h = line.split(": ")
		if (d_h[0] === "") {
			openingHours += "<td>Not known</td>";
		}
		else {
			openingHours +="<td>"+d_h[0]+"</td>"
			if (d_h.length > 1) openingHours +="<td>"+d_h[1]+"</td>"
		}
		openingHours +="</tr>"
	});
	openingHours += "</tbody></table>";
	$("#centerOpeningHours").html(openingHours)
	showMedicalCenterOnMap(obj);
}
/*
function launchWaze() {
	if(window.plugins != undefined) {
		window.plugins.webintent.startActivity({
			action: window.plugins.webintent.ACTION_VIEW,
			url: 'waze://?ll='+lat+','+lon}, 
			function() {}, 
			function() {alert('Failed to open Waze')}
		);
	}
}
*/
function getDistance(centerId) {
	var medicalCenters = $.grep(medicalCentersDistances, function(obj,idx){ 
		return (obj.id === centerId)
	});
	if (medicalCenters.length == 1) return medicalCenters[0].distance
	return null;
}

function displayMedicalCenterInList(obj) {

	//var lat = obj.marker.getPosition().lat()
	//var lng = obj.marker.getPosition().lng()
	//var str = '<span style="font-weight:bold">'+obj.name + '</span> - '+ obj.centreType
	//if (typeof obj.distance !== 'undefined') str +=" ("+obj.distance.toFixed(2)+"km away)"
	//var str ="<a href='javascript:showMedicalCenterOnMap("+obj.id+")'>"+obj.name+"</a>"
	var str = "<li  data-filtertext='"+obj.name+"' center-id='"+obj.id+"'>" //data-icon='info'
	str +="<a href='#centerDetails'>"
	str += "<h3>"+obj.name +"</h3>"
	str += "<p><strong>"+obj.address+"</strong></p>"
	/*str += "<p class='ui-li-aside'>"
	$.each(obj.phoneNumbers, function(idx,phoneNumber) {
		str +="Phone: <a href='tel:"+parsePhoneNumber(phoneNumber.number)+"'>"+phoneNumber.number+"</a>"
	});
	str += "</p>"*/
	
	/*
	$.each(obj.openingHours, function(idx,line) {
		str +="<p>"+line+"</p>"
	});
	*/
	//$.each(obj.phoneNumbers, function(idx,phoneNumber) {
	//str +="<p>Phone: "+phoneNumber.number+"</p>"
	//str +="<p>Phone: <a href='tel:"+parsePhoneNumber(phoneNumber.number)+"'>"+phoneNumber.number+"</a></p>"
	//});
	var distance = getDistance(obj.id)
	if (distance !== null) {
		str+="<p class='ui-li-aside'>"+distance.toFixed(2)+"km away</p>"
	}
	str +="</a>"
	str +="</li>"
	return str;
}

function showMedicalCenterOnMap(medicalCenter) {
	var latLng = new google.maps.LatLng(medicalCenter.location.lat, medicalCenter.location.lon);
	map.clear('markers')
	map.addMarker({'position': latLng }).click(function() {
							map.openInfoWindow({ 'content': medicalCenter.name }, this);
						});
	map.get('map').setCenter(latLng);
	$('#map_canvas').gmap('refresh');
}

function jumpToMyLocation() {
	map.setCenter(myPos);
}

function getMedicalCenterById(id) {
	for(var i=0 ; i < medicalCentersList.length; ++i) {
		if (medicalCentersList[i].id === id) return medicalCentersList[i];
	}
}

function handleCurrentPosition(position) {
	myPos = new google.maps.LatLng(position.coords.latitude ,position.coords.longitude);
	/*
	var markerTitle = "You are here"
	myPosMarker = new google.maps.Marker({
					position: myPos,
					map: map,
					title: markerTitle,
					icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
				});
	var infowindow = new google.maps.InfoWindow({
		content: '<div>'+markerTitle+'</div>'
	});
	map.setCenter(myPos);*/
	
	updateMedicalCentersDistances();
}

function handleNoGeo(error) {
	if ($('input[name=searchBy]:radio:checked').length === 0) {
		$("input[name=searchBy]:radio[value=byArea]").click()
	}
}
function showError(error)
  {
  switch(error.code) 
    {
    case error.PERMISSION_DENIED:
      alert("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      alert("Location information is unavailable.")
      break;
    case error.TIMEOUT:
      alert("The request to get user location timed out.")
      break;
    case error.UNKNOWN_ERROR:
      alert("An unknown error occurred.")
      break;
    }
  }
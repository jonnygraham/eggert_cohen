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
	/*handleCurrentPosition({coords: {longitude:35.217254, latitude: 31.780496}})
	return*/
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
		var id = idx;
		console.log(idx)
		console.log(obj.location.lat,obj.location.lon)
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
	console.log(medicalCentresData)
	$.each(medicalCentresData,processMedicalCenter)
	/*$.getJSON("data/medicalCenters.json",function(medicalCenters) {
		$.each(medicalCenters,processMedicalCenter)
	});
	*/
}

function updateMedicalCentersWithDistance() {
	$.each(medicalCentersList, function(idx, obj){
		var distance = getDistanceFromLatLonInKm(myPos.lat(), myPos.lng(), obj.location.lat, obj.location.lon);
		obj.distance = distance;
	});
	medicalCentersList.sort(function(a,b) {
		return (a.distance < b.distance) ? -1 : 1
	});
}

function populateAreaList() {
	var areas = medicalCentersList.map(function(obj) { return obj.area })
	console.log(areas)
	x = areas
	var distinctAreas = areas.filter(function(itm,i,areas){
		return i==areas.indexOf(itm);
	});
	//$.unique(areas).sort()
	$.each(distinctAreas,function(idx, area) {
		$('#areaSelector').append('<option value="'+area+'">'+area+'</option>')
	})
}

$(document).ready(function() {
	
    var mapOptions = {
    zoom: 18,
    center: new google.maps.LatLng(31.780496,35.217254),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);
	prepareData();
	populateAreaList();
	
	$('input[name=searchBy]:radio').change(function () {

		$("#medicalCenters").html("")
		var chosenSearchBy = $('input[name=searchBy]:radio:checked').val()
		if (chosenSearchBy === 'byArea') {
			$('#byArea').siblings().hide()
			$('#byArea').show()
			$('#areaSelector').trigger('change');
		}
		else {
			console.log("Clicked on nearest")
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
	})
	$("#areaSelector").change(function () {
		var area = $("#areaSelector option:selected").val();
		displayMedicalCenters(100,function(medicalCenter) {
			return medicalCenter.area === area;
		});		
	});
	getCurrentLocation();
})

function parsePhoneNumber(phoneNum) {
	return phoneNum.replace(/-/g,'')
}

function displayMedicalCenters(maxToDisplay, filterFunction) {
	var str = ""
	$.each(medicalCentersList, function(idx, obj){ 
		if (idx <= maxToDisplay) {
			if(filterFunction(obj)) {
				str += displayMedicalCenter(obj) 
			}
		}
	});
	var contH = $('#top-section').height()
	var upH = $('#top-section-a').height();
	
	$('#medicalCenters').css('height' , contH-upH);
	$("#medicalCenters").html(str)
}
function displayMedicalCenter(obj) {

	var lat = obj.marker.getPosition().lat()
	var lng = obj.marker.getPosition().lng()
	var str = '<span style="font-weight:bold">'+obj.name + '</span> - '+ obj.centreType
	if (typeof obj.distance !== 'undefined') str +=" ("+obj.distance.toFixed(2)+"km away)"
	//var str ="<a href='javascript:showMedicalCenterOnMap("+obj.id+")'>"+obj.name+"</a>"
	str +="<ul>"
	
	str +="<li><a href='javascript:showMedicalCenterOnMap("+obj.id+")'>"+obj.address+"</a></li>"
	$.each(obj.phoneNumbers, function(idx,phoneNumber) {
		str +="<li>Phone: <a href='tel:"+parsePhoneNumber(phoneNumber.number)+"'>"+phoneNumber.number+"</a></li>"
	});
	$.each(obj.openingHours, function(idx,line) {
		str +="<li>Opening hours: "+line+"</li>"
	});
	str +="</ul>"
	return str;
}

function showMedicalCenterOnMap(id) {
	var medicalCenter = getMedicalCenterById(id);
	console.log(medicalCenter.location.lat+","+medicalCenter.location.lon)
	map.panTo(medicalCenter.latLng);
	window.setTimeout(function(){google.maps.event.trigger(medicalCenter.marker, 'click');},1000);
	//Todo instead of waiting 2 secs, should really listen on the 'idle' event
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
	map.setCenter(myPos);
	updateMedicalCentersWithDistance();
	// If user didn't choose a radio button yet, default to 'nearest'
	if ($('input[name=searchBy]:radio:checked').length === 0) {
		console.log("Auto clicking on 'nearest'")
		$("input[name=searchBy]:radio[value=nearest]").click()
	}
	
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
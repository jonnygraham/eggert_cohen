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
  return d.toFixed(2);
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function initialize() {
	if (navigator.geolocation)
    {
		navigator.geolocation.getCurrentPosition(showCurrentPosOnMap,handleNoGeo);
    }
	else {
		handleNoGeo();
	}
}

google.maps.event.addDomListener(window, 'load', initialize);

function prepareMedicalCenters() {
	medicalCentersList = new Array()
	$.each(medicalCenters, function(idx, obj){
		var distance = getDistanceFromLatLonInKm(myPos.lat(), myPos.lng(), obj.location.latitude, obj.location.longitude);
		var latLng = new google.maps.LatLng(obj.location.latitude,obj.location.longitude);
		var marker = new google.maps.Marker({
			position: latLng,
			map: map,
			title: obj.name
		});
		var infowindow = new google.maps.InfoWindow({
			content: '<div>'+obj.name+'</div>'
		});
		google.maps.event.addListener(marker, 'click', function() {
			if (typeof openInfoWindow !== 'undefined') openInfoWindow.close();
			openInfoWindow = infowindow;
			infowindow.open(map,marker);
		});
		medicalCentersList[idx] = { distance: distance,
			marker: marker,
			medicalCenter: obj }
	});
}

$(document).ready(function() {
	
	
	$("#areaSelector").change(function () {
		var str = "";
		var area = $("#areaSelector option:selected").val();
		$("#area").text("Medical Centers in the "+area + " Area");
		medicalCentersList.sort(function(a,b) {
			return (a.distance < b.distance) ? -1 : 1
		});
		$.each(medicalCentersList, function(idx, obj){ 
			if(obj.medicalCenter.area === area) {
				str += displayMedicalCenter(obj) 
				/*str +="<h2>"+obj.name+"</h2>"
				str +="<ul>"
				str +="</ul>"
				$.each(obj, function(key, value){
					if (key !== 'location' && key !== 'name') {
						if (key === 'phone') value = "<a href='tel:"+value.replace(/-/g,'')+"'>"+value+"</a>"
						str +="<li>"+key+": "+value+"</li>"
					}
				});*/
			}
		});
		$("#area").html(str)
	});
	 //.trigger('change');
})

function parsePhoneNumber(phoneNum) {
	return phoneNum.replace(/-/g,'')
}
function displayMedicalCenter(obj) {

	var lat = obj.marker.getPosition().lat()
	var lng = obj.marker.getPosition().lng()
	
	var str ="<h2><a href='javascript:jumpToPosition("+lat+","+lng+")'>"+obj.medicalCenter.name+"</a></h2>"
	str +="<ul>"
	str +="<li>"+obj.distance+"km away</li>"

	str +="<li>Phone: <a href='tel:"+parsePhoneNumber(obj.medicalCenter.phone)+"'>"+obj.medicalCenter.phone+"</a></li>"
	str +="<li>Opening hours: "+obj.medicalCenter.openingHours+"</li>"
	str +="</ul>"
	return str;
}

function jumpToPosition(latitude, longitude) {
	map.setCenter(new google.maps.LatLng(latitude, longitude));
}

function showMap(latlng,markerTitle) {
  var mapOptions = {
    zoom: 14,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);
  var marker = new google.maps.Marker({
					position: map.center,
					map: map,
					title: markerTitle
				});
	var infowindow = new google.maps.InfoWindow({
		content: '<div>'+markerTitle+'</div>'
	});
	google.maps.event.addListener(marker, 'click', function() {
		if (typeof openInfoWindow !== 'undefined') openInfoWindow.close();
		openInfoWindow = infowindow;
		infowindow.open(map,marker);
	});
}

function showCurrentPosOnMap(position) {
	myPos = new google.maps.LatLng(position.coords.latitude ,position.coords.longitude);
	showMap(myPos,"You are here");
	prepareMedicalCenters();
}

function handleNoGeo() {
	myPos = new google.maps.LatLng(31.780496,35.217254);
	showMap(myPos,"Egert & Cohen Jerusalem Office");
	prepareMedicalCenters();
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
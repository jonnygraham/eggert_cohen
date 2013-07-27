function initialize() {
  var mapOptions = {
    zoom: 12,
    center: new google.maps.LatLng(32.78605,35.693872),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);
  new google.maps.Marker({
					position: map.center,
					map: map,
					title: 'You are here'
				});
}

google.maps.event.addDomListener(window, 'load', initialize);

$(document).ready(function() {
	$("#area").text("hello");
	$("#areaSelector").change(function () {
		var str = "";
		var area = $("#areaSelector option:selected").val();
		$("#area").text("Medical Centers in the "+area + " Area");
		$.each(medicalCenters, function(idx, obj){ 
			if(obj.area === area) {
				str +="<h2>"+obj.name+"</h2>"
				str +="<ul>"
				str +="</ul>"
				$.each(obj, function(key, value){
					if (key !== 'location' && key !== 'name') {
						if (key === 'phone') value = "<a href='tel:"+value+"'>"+value+"</a>"
						str +="<li>"+key+": "+value+"</li>"
					}
				});
				var medicalCenterPosition = new google.maps.LatLng(obj.location.longitude,obj.location.latitude);
				new google.maps.Marker({
					position: medicalCenterPosition,
					map: map,
					title: obj.name
				});
			}
		});
		$("#area").html(str)
	});
	 //.trigger('change');
})

function show_map(loc) {
  $("#map-container").css({'width':'320px','height':'350px'});
  var map = new GMap2(document.getElementById("map-container"));
  var center = new GLatLng(loc.coords.latitude, loc.coords.longitude);
  map.setCenter(center, 14);
  map.addControl(new GSmallMapControl());
  map.addControl(new GMapTypeControl());
  map.addOverlay(new GMarker(center, {draggable: false, title: "You are here (more or less)"}));
}
package medical
import scala.io.Source
import org.codehaus.jackson.map.ObjectMapper
import java.io.StringWriter
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import com.google.code.geocoder.{GeocoderRequestBuilder, Geocoder}
import com.google.code.geocoder.model.{LatLng,GeocodeResponse}

object MedicalCentersParser extends App {

  val geocoder = new Geocoder();//"me","AIzaSyCHY-yaptci4zv7sZQUw8CJ0wERPWxBt3g")

  def getLatLng(address : String) = {
    val geocoderRequest = new GeocoderRequestBuilder().setAddress(address).setLanguage("en").getGeocoderRequest();
    val geocoderResponse = geocoder.geocode(geocoderRequest);
	def getLatLon(response : GeocodeResponse) = {
	  val loc = response.getResults.get(0).getGeometry.getLocation
      LatLon(loc.getLat,loc.getLng)
	}
    if (geocoderResponse.getResults.isEmpty) {
	  println("Failed finding "+address)
	  Thread.sleep(2000)
	  val geocoderRequest2 = new GeocoderRequestBuilder().setAddress(address).setLanguage("en").getGeocoderRequest();
      val geocoderResponse2 = geocoder.geocode(geocoderRequest2);
	  if (geocoderResponse2.getResults.isEmpty) {
	    println("Failed again")
		LatLon(0,0)
      } else {
		println("OK")
		getLatLon(geocoderResponse2)
	  }
	  } else getLatLon(geocoderResponse)
  }


  type Address = String
  type Name = String
  type Area = String
  type OpeningHours = String

  case class PhoneNumber( phoneType: Option[String], number: String, extension: Option[String])
  type MedicalCentreType = String
  //object MedicalCentreType extends Enumeration {
  //	val Clinics,	Doctors,	Pharmacies, laboratories = Value
  //}

  case class LatLon(lat : BigDecimal, lon : BigDecimal)
  case class MedicalCentre(id: String, centreType : MedicalCentreType, area: Area, name : Name, address: Address, openingHours: List[OpeningHours], phoneNumbers : List[PhoneNumber], location : LatLon)

  def stripQuotes(s : String) = if (s.startsWith("\"") && s.endsWith("\"")) s.tail.reverse.tail.reverse else s

  var area = ""
  var centreType = ""
  var id = 1
  var medicalCenters : List[MedicalCentre] = Nil
  Source.fromFile("C:/dev/egert_cohen/medicalCentres.csv").getLines.drop(1).foreach{ line =>
    val cols : List[String] = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)").toList.map(s=>stripQuotes(s).trim)
    cols match {
      case Nil  => // do nothing
      case x :: Nil =>
        x match {
          case x if x endsWith "area" => area = x.reverse.drop(5).reverse
          case x => centreType = x
        }
      case name :: address :: data =>
        //println("Data: "+data)
        val hours = if (data.isEmpty) "" else data.head
        val telephone = if (data.isEmpty || data.tail.isEmpty) "" else data.tail.head
        if (name == "") {
          //println("Additional data for previous medical center")
          val medCent = medicalCenters.last
          val medCentIndex = medicalCenters.length -1
          val updatedHours = if (hours == "") medCent.openingHours else medCent.openingHours :+ hours
          val updatedPhoneNumbers = if (telephone == "") medCent.phoneNumbers else medCent.phoneNumbers :+ PhoneNumber(None,telephone,None)
          val updatedMedCent = MedicalCentre(medCent.id,medCent.centreType, medCent.area, medCent.name, medCent.address, updatedHours, updatedPhoneNumbers,medCent.location)
          medicalCenters = medicalCenters.updated(medCentIndex,updatedMedCent)
        }
        else {
          val add = address+", Israel"
          val loc = getLatLng(add)
          //println("****"+add+": "+loc)
          val medCent = MedicalCentre(id.toString,centreType, area, name, address, List(hours),List(PhoneNumber(None,telephone,None)),  loc)
		  id = id+1
          medicalCenters = medicalCenters :+ medCent
        }
      case unknown => println("Unknown:"+unknown)
    }
  }
  println(medicalCenters.mkString("\n"))

  val mapper = new ObjectMapper()
  mapper.registerModule(DefaultScalaModule)

  val out = new StringWriter
  mapper.writeValue(out, medicalCenters)
  val json = out.toString
  println(json)

}



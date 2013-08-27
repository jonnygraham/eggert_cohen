package com.jonny

import scala.io.Source

object MedicalCentersParser extends App {

  def stripQuotes(s : String) = if (s.startsWith("\"") && s.endsWith("\"")) s.tail.reverse.tail.reverse else s
  
  var area = ""
  var centreType = ""
  var medicalCenters : List[MedicalCentre] = Nil
  Source.fromFile("medicalCentres.csv").getLines.drop(1).foreach{ line =>
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
		  val updatedMedCent = MedicalCentre(medCent.centreType, medCent.area, medCent.name, medCent.address, updatedHours, updatedPhoneNumbers)
		  medicalCenters = medicalCenters.updated(medCentIndex,updatedMedCent)
		}
		else {
			val medCent = MedicalCentre(centreType, area, name, address, List(hours),List(PhoneNumber(None,telephone,None)))
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



type Address = String
type Name = String
type Area = String
type OpeningHours = String
	
case class PhoneNumber( phoneType: Option[String], number: String, extension: Option[String])
type MedicalCentreType = String
//object MedicalCentreType extends Enumeration {
//	val Clinics,	Doctors,	Pharmacies, laboratories = Value
//}
case class MedicalCentre(centreType : MedicalCentreType, area: Area, name : Name, address: Address, openingHours: List[OpeningHours], phoneNumbers : List[PhoneNumber])
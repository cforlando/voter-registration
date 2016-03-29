#GPL2, Copyright 2015 Chad MILLER  http://chad.org/
from collections import namedtuple

registration_field_names = [ 'countycode', 'voterid', 'namelast', 'namesuffix', 'namefirst', 'namemiddle', 'withheld', 'residenceline1', 'residenceline2', 'residencecity', 'residenceUNKNOWNDATA', 'residencezipcode', 'mailingline1', 'mailingline2', 'mailingline3', 'mailingcity', 'mailingstate', 'mailingzipcode', 'mailingcountry', 'gender', 'race', 'birthdate', 'registrationdate', 'party', 'precinct', 'precinctgroup', 'precinctsplit', 'precinctsuffix', 'voterstatus', 'congressionaldictrict', 'schoolboarddistrict', 'districtUNKNOWNDATA1', 'districtUNKNOWNDATA2', 'districtUNKNOWNDATA3', 'phoneareacode', 'phonenumber', 'phonenumberext', 'emailaddress']
registration = namedtuple("registration", registration_field_names)

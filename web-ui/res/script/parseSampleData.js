(function($) {
  $(function() {
    $.get('/res/sampleData.txt', function(data) {

      var nameBirthdayRegex = /\n([A-Za-z -.]+)was born(?: on)?\s+([0-9]+\s+[A-Za-z]+\s+[0-9]{4})\b(.*)$/,
        addressVoterIdRegex = /the address (.*\b[0-9]{0-5}|.*)U\.S\.A.*Voter ID number ([0-9]+)/,
        countyRegex = /(.*) county/i,
        singleSpaceRecombine = function(s) {
          return s.trim().split(/\s+/).join(' ')
        },
        deconstructAddress = function(s) {
          s = singleSpaceRecombine(s)
          var parts = s.split(' in ')
          if (parts.length < 2)
            return s
          parts = [parts[0].trim()]
            .concat(
              parts[1].trim()
              .split(',')
              .map(function(s) {
                return s.trim()
              })
              .filter(function(s) {
                return !!s
              })
            )
          if (countyRegex.test(parts[2]))
            parts[2] = countyRegex.exec(parts[2])[1]
          return {
            streetAddress: parts[0],
            city: parts[1],
            county: parts[2],
            state: parts[3]
          }
        },
        idBirthDateMap = {},
        extractInfo = function(s) {
          var nameBirthdayMatch = nameBirthdayRegex.exec(s)
          if (nameBirthdayMatch) {
            var name = nameBirthdayMatch[1],
              birthDate = nameBirthdayMatch[2],
              remainder = nameBirthdayMatch[3].trim(),
              addressVoterIdMatch = addressVoterIdRegex.exec(remainder)
            if (addressVoterIdMatch) {
              var address = addressVoterIdMatch[1],
                voterId = addressVoterIdMatch[2],
                randomDate = idBirthDateMap[voterId]
              if (!randomDate) {
                randomDate = new Date(birthDate)
                randomDate.setDate(randomDate.getDate() + Math.round((Math.random() - 0.5) * 5555))
                idBirthDateMap[voterId] = randomDate
              }
              return {
                name: singleSpaceRecombine(name),
                birthDate: randomDate.toDateString(),
                address: deconstructAddress(address),
                voterId: voterId
              }
            }
          }

          return null;
        }

      // Regex for 2+ (\n{2,}) doesn't work
      var validData = data.split('\n\n')
        .map(function(chunk) {
          return extractInfo(chunk.trim())
        })
        .filter(function(data) {
          return !!data
        })
      console.log(JSON.stringify(validData))
    })
  })
})(jQuery);

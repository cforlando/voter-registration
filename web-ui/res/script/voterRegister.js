(function($) {
  /** Index of token to data */
  var _index = {},
    /** Month text (for filtering) */
    _months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
    /**
     * Indexes {@code data} for each token
     * @param {{}} data
     * @param {[string]} tokens
     * @return {[]} of all tokens lowercase
     */
    indexDataToken = function(data, tokens) {
      var tokens = tokens.map(function(token) {
        if (token.length < 3)
          return ''

        token = token.toLowerCase()
        var tokenData = _index[token]
        if (!tokenData) {
          tokenData = []
          _index[token] = tokenData
        }
        tokenData.push(data)

        return token
      }).filter(t => !!t)

      return tokens
    },
    spaceRegExp = /\s+/,
    /**
     * @param {string} s
     * @return {[]} all tokens in {@code s} (separated by spaces) or an empty array if empty
     */
    splitToTokens = function(s) {
      s = s ? s.trim() : ''
      return s ? s.split(spaceRegExp) : []
    },
    /**
     * Indexes {@code d} adding property {@code tokenString} of space separated lowercase tokens
     * @param {{birthDate: Date, address: {}, name: string}} d
     */
    indexData = function(d) {
      d.tokenString = {}

      var date = d.birthDate
        // Birthdate month name abbreviation ane year
      d.tokenString.dob = indexDataToken(d, [_months[date.getMonth()], date.getFullYear() + '']).join(' ').toLowerCase()

      // All address values
      var addressToken = [];
      for (var key in d.address) {
        var value = d.address[key]
        addressToken.push(indexDataToken(d, splitToTokens(value)).join(' '))
      }
      d.tokenString.address = addressToken.filter(t => !!t).join(' ').toLowerCase()

      // Name
      d.tokenString.name = indexDataToken(d, splitToTokens(d.name)).join(' ').toLowerCase()
    },
    /**
     * @return {string} title cased {@code s}
     */
    toTitleCase = function(s) {
      return s ? s.trim()
        .split(spaceRegExp)
        .map(function(token) {
          return token[0].toUpperCase() + token.substr(1).toLowerCase()
        })
        .join(' ') : ''
    },
    /**
     * Indexes and preps {@code data} for filtering and display
     */
    onDataLoad = function(data) {
      data.forEach(function(d) {
        // Transform the birthdate to an actual date
        var date = new Date(d.birthDate)
        d.birthDate = date

        // Craft readable text
        var month = toTitleCase(_months[date.getMonth()]),
          a = d.address,
          hasAddress = a.streetAddress || a.city || a.state || a.county
        d.text = {
          name: toTitleCase(d.name),
          dob: sprintf('%s %d %d', month, date.getDate(), date.getFullYear()),
          address: hasAddress ? sprintf('%s %s %s (%s)',
            toTitleCase(a.streetAddress),
            toTitleCase(a.city),
            toTitleCase(a.state),
            toTitleCase(a.county)) : ''
        }

        indexData(d)
      })
    }

  $(function() {
    // Sample data
    $.get('/res/sampleData.json', data => onDataLoad(data))

    var $nameInput = $('input[name=name]'),
      $dobInput = $('input[name=date-of-birth]'),
      $addressInput = $('textarea[name=address]'),
      /**
       * @param {HTMLElement} input
       * @return {[]} tokens of {@code input} value
       */
      splitValueToTokens = function($input) {
        return splitToTokens($input.val())
      },

      filterCard = $('#filter-card')[0],
      filterList = $('#filter-list')[0],
      /**
       * @return {HTMLElement} for showing in the filter list
       */
      createFilterLi = function(text) {
        var li = document.createElement('li')
        li.classList.add('list-group-item')
        li.textContent = text
        return li
      },
      /**
       * @return {HTMLElement} li element wired and presentable with {@code data}
       */
      createFilterElement = function(data) {
        var date = data.birthDate,
          text = data.text,
          li = createFilterLi(sprintf('%s\n%s\n%s', text.name, text.address, text.dob))
        $(li).data('data', data)
          .on('click', function(e) {
            var dataText = $(this).data('data').text
            $nameInput.val(dataText.name)
            $dobInput.val(dataText.dob)
            $addressInput.val(dataText.address)

            updateTextInfo()
          })
        return li
      },
      /**
       * List data not filtered out
       */
      listMatches = function(matches) {
        // TODO Detach/attach instead of remove/create
        while (filterList.firstChild) {
          filterList.removeChild(filterList.firstChild);
        }

        var maxShowCount = 6,
          count = matches.length
        matches.slice(0, maxShowCount)
          .some(function(match) {
            filterList.appendChild(createFilterElement(match))
          })
        if (count > maxShowCount) {
          var li = createFilterLi(sprintf('%d not shown', count - maxShowCount))
          filterList.insertBefore(li, filterList.firstChild)
        }

        filterCard.style.display = filterList.children.length ? '' : 'none'
      },

      /**
       * Filters data matching defined input
       */
      filterData = function() {
        var nameTokens = splitValueToTokens($nameInput),
          dobTokens = splitValueToTokens($dobInput),
          addressTokens = splitValueToTokens($addressInput),
          matchingData = null,
          // Shallow match on all tokens
          allTokens = [].concat.apply([], [nameTokens, addressTokens, dobTokens])
          .filter(t => t.length > 2)
          .some(function(token) {
            var tl = token.toLowerCase()
            if (!matchingData) {
              matchingData = _index[tl]
            } else {
              matchingData = matchingData.filter(function(m) {
                for (var key in m.tokenString)
                  if (~m.tokenString[key].indexOf(tl))
                    return true
                return false
              })
            }

            // Exit loop on no match
            if (!(matchingData && matchingData.length))
              return true
          })

        if (!matchingData)
          matchingData = []

        // Stricter match on exact field
        matchingData = matchingData.filter(function(match) {
          if (nameTokens.length && !isTokenInString(match.tokenString.name, nameTokens))
            return false
          if (addressTokens.length && !isTokenInString(match.tokenString.address, addressTokens))
            return false
          if (dobTokens.length && !isTokenInString(match.tokenString.dob, dobTokens))
            return false
          return true
        })

        listMatches(matchingData)
      },
      /**
       * @param {string} s
       * @param {[]} tokens
       * @return TRUE if {@code s} is in any token
       */
      isTokenInString = function(s, tokens) {
        for (var i = 0, L = tokens.length; i < L; i++) {
          if (~s.indexOf(tokens[i]))
            return true
        }
        return false
      },
      $nameDisplay = $('#name-display'),
      $partyDisplay = $('#party-display'),
      $addressDisplay = $('#address-display'),
      updateTextInfo = function() {
        var name = $nameInput.val().trim()
        $nameDisplay.text(name ? name : 'Name')
        var address = $addressInput.val().trim(),
          partyCode = $partyText.attr('data-code'),
          party = partyCode ? $partyText.text() : ''
        $partyDisplay.text(party ? party : 'Party not selected')
        $addressDisplay.text(address ? address : 'Address')
      }

    // Filter data on any information input change
    Rx.Observable.fromEvent($('[name=name],[name=date-of-birth],[name=address]'), 'keyup')
      .pluck('target', 'value')
      .debounce(250)
      .distinctUntilChanged()
      .subscribe(
        function(data) {
          filterData()
          updateTextInfo()
        },
        error => console.error(error)
      )

    // Party selection
    var $partyText = $('#partyDropdown')
    $('.dropdown-menu').on('click', '.dropdown-item', function(e) {
      e.preventDefault()
      var partyCode = this.dataset.code,
        partyName = this.textContent
      $partyText.attr('data-code', partyCode)
      $partyText.text(partyName)

      updateTextInfo()
    })

    // Submit
    $('#submit').on('click', function(e) {
      // TODO Take action on submit
      console.log('Submit is pressed')
    })
  })
})(jQuery);

fill_results_list = (voting_id_block, results_list) ->
	if not voting_id_block_cache
		return

	if not voting_id_block_cache[voting_id_block]
		return

	if not voting_id_block_cache[voting_id_block].data
		return

	#for own voter_id, voter_details of voting_id_block_cache[voting_id_block].data
	#	if voter_id.substr(0, 4) != voting_id_block
	#		console.log "Expected id #{voter_id} to start with #{voting_id_block}. #{voter_id.substr 0, 4}"

	for child in results_list.children
		child_item_voter_id_group = child.dataset.voteridgroup
		child_item_voter_id = child.dataset.voterid

		if voting_id_block == "#{voting_id_block}"
			result_for_line =  voting_id_block_cache[voting_id_block].data[child_item_voter_id]
			#console.debug "#{result_for_line}, #{child_item_voter_id}"
			if result_for_line
				child.innerHTML = "#{voting_id_block_cache[voting_id_block].data[child_item_voter_id]}"

			#for own key, voter_details of voting_id_block_cache[voting_id_block].data
			#	if key == child_item_voter_id
			#		console.debug "returned item #{key} is list item #{child_item_voter_id}?  #{key == child_item_voter_id}"




voter_id_block_division = 10000
voting_id_block_cache = false
show_results_for_birthday_and_voteridblock = (results_list, voter_id_with_weights_list, birthday) ->
	blocks_to_look_up = new Array
	n = 0
	#console.log birthday
	#console.log (pair[0] for pair in voter_id_with_weights_list)
	for voter_id, weight in voter_id_with_weights_list
		n++
		if n > 20
			break
		block = "#{Number.parseInt(voter_id) // voter_id_block_division}"
		blocks_to_look_up[block] = true

	for own block, _ of blocks_to_look_up
		existing_cache = voting_id_block_cache[block]
		if not existing_cache
			voting_id_block_cache[block] = new Array
			voting_id_block_cache[block].req = new XMLHttpRequest
			voting_id_block_cache[block].data = false

			do (results_list, block, birthday) ->
				voting_id_block_cache[block].req.addEventListener "load", (event) ->
					if voting_id_block_cache[block].req.status == 404
						console.debug voting_id_block_cache[block].req
					else

						#console.debug voting_id_block_cache[block].req

						#console.log "block #{block} in #{voting_id_block_cache[block].req.responseURL} url"
						voting_id_block_cache[block].data = JSON.parse voting_id_block_cache[block].req.responseText
					fill_results_list block, results_list

			details_birthday_json_url = "data/#{birthday.slice(-4)}/voter-info-list-grouped-by-voterid-#{block}-birthday-#{birthday}.json"
			voting_id_block_cache[block].req.open "GET", details_birthday_json_url, true
			voting_id_block_cache[block].req.send()
		else
			fill_results_list block, results_list

		for child in results_list.children
			voter_id_group = child.dataset.voteridgroup
			if voter_id_group == "#{block}"
				child.innerHTML = "(one moment please)"



terminating_key = ""

gather_voterids_below_trie_node = (trie_to_voterids, weights, current_depth, max_depth, enough_count=100) ->
	if not trie_to_voterids
		return

	if terminating_key of trie_to_voterids
		for voterid in trie_to_voterids[terminating_key]

			if voterid not of weights
				weights[""+voterid] = 0  # be sure to treat key as string, not numerical index
			weights[""+voterid] += (max_depth - current_depth)  # Be sure to treat key as string, not numerical index


	# Breadth-first search from here to find names that could complete the search phrase.
	if current_depth < max_depth
		for remaining_ch, subtrie of trie_to_voterids
			if remaining_ch != terminating_key
				console.log weights.keys().length
				if weights.keys().length < enough_count
					gather_voterids_below_trie_node subtrie, weights, current_depth+1, max_depth, enough_count
				else
					console.log "enough #{weights.keys().length}"
			else
				console.log "is terminating key, so we don't recurse"



timeout_function = null

try_search = (widget, trie_to_voterids, results_list, birthday) ->

	if timeout_function
		t = timeout_function
		timeout_function = null
		window.clearTimeout t

	search_text = widget.value.toLocaleLowerCase()
	voterid_to_weight_map = new Array
	for word in search_text.split(/ +/)
		stem = trie_to_voterids
		for ch in word
			stem = stem[ch]
			if not stem
				break

		gather_voterids_below_trie_node stem, voterid_to_weight_map, 0, 7

	# change key-value array into array of tuples
	voter_id_with_weights = ([k,v] for own k,v of voterid_to_weight_map)
	
	voter_id_with_weights.sort (l, r) ->
		l[1] - r[1]  # reverse sort using second item, weight

	while results_list.lastChild
		results_list.removeChild results_list.lastChild

	limit = 20
	for pair in voter_id_with_weights
		limit--
		if limit < 0
			break
		li = document.createElement "LI"
		li.setAttribute "value", pair[1]
		li.setAttribute "data-voterid", pair[0]
		li.setAttribute "data-voteridgroup", pair[0] // voter_id_block_division
		li.appendChild document.createTextNode "(voter id ##{pair[0]}, birthday #{birthday} for search #{search_text})"
		results_list.appendChild li


	do (voter_id_with_weights, results_list, birthday) ->
		render_result = () ->
			show_results_for_birthday_and_voteridblock results_list, voter_id_with_weights, birthday

		timeout_function = window.setTimeout render_result, 180


retrieve_birthday_request = null
	
document.choose_birthday_and_activate_search = (widget, search_widget_id, results_to_widget_id, progress_to_widget_id) ->

	if retrieve_birthday_request
		r = retrieve_birthday_request  # avoid race
		r.abort()

	birthday = widget.value  # in format "mm/dd/yyyy". Dumb americans.

	voting_id_block_cache = new Array

	search_bar = document.getElementById search_widget_id
	results_to_widget = document.getElementById results_to_widget_id
	progress_bar = document.getElementById progress_to_widget_id

	birthday_json_url = "data/#{birthday.slice(-4)}/trie-to-voterid-for-birthday-#{birthday}.json"
	retrieve_birthday_request = new XMLHttpRequest
	do (retrieve_birthday_request, progress_bar, results_to_widget, birthday) ->
		retrieve_birthday_request.addEventListener "progress", (event) ->

			if event.lengthComputable
				percent_complete = event.loaded / event.total
				progress_bar.innerHTML = "loaded #{percent_complete * 10000 // 100}%"
			else
				progress_bar.innerHTML = "...loading"

		retrieve_birthday_request.addEventListener "load", (event) ->


			if retrieve_birthday_request.readyState == 4
				if retrieve_birthday_request.status == 404
					progress_bar.innerHTML = "birthday not valid"
				else
					progress_bar.innerHTML = "almost done..."

					trie_to_voterids = JSON.parse retrieve_birthday_request.responseText
					if not trie_to_voterids
						progress_bar.innerHTML = "internal error"
					else
						progress_bar.innerHTML = "ready to search"
						search_bar.disabled = false
						do (trie_to_voterids, search_bar, results_to_widget) ->
							search_bar.oninput = () ->
								if search_bar.value.length < 3
									return true
								try_search search_bar, trie_to_voterids, results_to_widget, birthday
						search_bar.focus()
			else
				console.warn "unknown readyState"
				console.warn retrieve_birthday_request

	retrieve_birthday_request.open "GET", birthday_json_url, true
	retrieve_birthday_request.send()

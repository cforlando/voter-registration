voter_id_block_division = 100000

show_results_for_year_and_voteridblock = (results_list, voter_id_with_weights_list, year) ->
	blocks_to_look_up = new Array
	n = 0
	for voter_id, weight in voter_id_with_weights_list
		n++
		if n > 10
			break
		block = Number.parseInt(voter_id) // voter_id_block_division
		blocks_to_look_up[block] = true

	for own block_to_look_up, _ of blocks_to_look_up
		req = new XMLHttpRequest

		do (req, results_list, block_to_look_up, year) ->
			req.addEventListener "progress", (event) ->
				# console.log event

			req.addEventListener "load", (event) ->
				console.debug event
				if req.status == 404
					console.debug req
				else
					voter_details = JSON.parse req.responseText

					console.debug req.responseText

					for child in results_list.children
						voter_id_group = child.dataset.voteridgroup
						voter_id = child.dataset.voterid
						if voter_id_group == "#{block_to_look_up}"
							child.innerHTML = "#{voter_details[voter_id]}"


		details_year_json_url = "data/voter_info_list_grouped_by_voterid-#{block}-year-#{year}.json"
		req.open "GET", details_year_json_url, true
		req.send()

		for child in results_list.children
			voter_id_group = child.dataset.voteridgroup
			if voter_id_group == "#{block_to_look_up}"
				child.innerHTML = "(one moment please)"


terminating_key = ""

gather_voterids = (trie_to_voterids, weights, current_depth, max_depth) ->
	if not trie_to_voterids
		return

	if terminating_key of trie_to_voterids
		for voterid in trie_to_voterids[terminating_key]

			if voterid not of weights
				weights[voterid] = 0
			weights[voterid] += (max_depth - current_depth)


	if current_depth < max_depth
		for remaining_ch, subtrie of trie_to_voterids
			if remaining_ch != terminating_key
				if weights.length < 50
					gather_voterids subtrie, weights, current_depth+1, max_depth


timeout_function = null

try_search = (widget, trie_to_voterids, results_list, year) ->

	if timeout_function
		t = timeout_function
		timeout_function = null
		window.clearTimeout t

	widget_text = widget.value.toLocaleLowerCase()
	if widget_text.length < 3
		return

	voterid_to_weight_map = new Array
	for word in widget_text.split(/ +/)
		stem = trie_to_voterids
		for ch in word
			stem = stem[ch]
			if not stem
				break

		gather_voterids stem, voterid_to_weight_map, 0, 3

	# change key-value array into array of tuples
	voter_id_with_weights = ([k,v] for own k,v of voterid_to_weight_map)
	
	voter_id_with_weights.sort (l, r) ->
		l[1] - r[1]  # reverse sort using second item, weight

	while results_list.lastChild
		results_list.removeChild results_list.lastChild

	for pair in voter_id_with_weights
		li = document.createElement "LI"
		li.setAttribute "value", pair[1]
		li.setAttribute "data-voterid", pair[0]
		li.setAttribute "data-voteridgroup", pair[0] // voter_id_block_division
		li.appendChild document.createTextNode "(voter id ##{pair[0]})"
		results_list.appendChild li


	do (voter_id_with_weights, results_list, year) ->
		render_result = () ->
			show_results_for_year_and_voteridblock results_list, voter_id_with_weights, year

		timeout_function = window.setTimeout render_result, 180


retrieve_year_request = null
	
document.choose_year_and_activate_search = (widget, search_widget_id, results_to_widget_id, progress_to_widget_id) ->
	console.debug "choosing year"

	year = widget.value

	if retrieve_year_request
		r = retrieve_year_request  # avoid race
		r.abort()

	search_bar = document.getElementById search_widget_id
	results_to_widget = document.getElementById results_to_widget_id
	progress_bar = document.getElementById progress_to_widget_id

	year_json_url = "data/trie-to-voterid-for-birth-year-#{year}.json"
	retrieve_year_request = new XMLHttpRequest
	do (retrieve_year_request, progress_bar, results_to_widget, year) ->
		retrieve_year_request.addEventListener "progress", (event) ->
			if event.lengthComputable
				console.log "progress"
				percent_complete = event.loaded / event.total
				progress_bar.innerHTML = "loaded #{percent_complete * 10000 // 100}%"
			else
				console.log "no progress"
				progress_bar.innerHTML = "...loading"

		retrieve_year_request.addEventListener "load", (event) ->
			console.log "loaded"
			console.log retrieve_year_request
			search_bar.disabled = true
			if retrieve_year_request.readyState == 1
				progress_bar.innerHTML = "requesting"
			else if retrieve_year_request.readyState == 2
				progress_bar.innerHTML = "receiving"
			else if retrieve_year_request.readyState == 3
				progress_bar.innerHTML = "loading ..."
			else if retrieve_year_request.readyState == 4

				if retrieve_year_request.status == 404
					progress_bar.innerHTML = "year not valid"
				else
					progress_bar.innerHTML = "almost done..."

					trie_to_voterids = JSON.parse retrieve_year_request.responseText
					if not trie_to_voterids
						progress_bar.innerHTML = "internal error"
					else
						progress_bar.innerHTML = "ready to search"
						search_bar.disabled = false
						do (trie_to_voterids, search_bar, results_to_widget) ->
							search_bar.oninput = () ->
								try_search search_bar, trie_to_voterids, results_to_widget, year
						search_bar.focus()
			else
				console.warn "unknown readyState"
				console.warn retrieve_year_request

	retrieve_year_request.open "GET", year_json_url, true
	retrieve_year_request.send()

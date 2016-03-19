// Generated by CoffeeScript 1.9.3
(function() {
  var gather_voterids, retrieve_year_request, show_results_for_year_and_voteridblock, terminating_key, timeout_function, try_search, voter_id_block_division,
    hasProp = {}.hasOwnProperty;

  voter_id_block_division = 100000;

  show_results_for_year_and_voteridblock = function(results_list, voter_id_with_weights_list, year) {
    var _, block, block_to_look_up, blocks_to_look_up, child, details_year_json_url, fn, i, len, n, req, results, voter_id, voter_id_group, weight;
    blocks_to_look_up = new Array;
    n = 0;
    for (weight = i = 0, len = voter_id_with_weights_list.length; i < len; weight = ++i) {
      voter_id = voter_id_with_weights_list[weight];
      n++;
      if (n > 10) {
        break;
      }
      block = Math.floor(Number.parseInt(voter_id) / voter_id_block_division);
      blocks_to_look_up[block] = true;
    }
    fn = function(req, results_list, block_to_look_up, year) {
      req.addEventListener("progress", function(event) {});
      return req.addEventListener("load", function(event) {
        var child, j, len1, ref, results1, voter_details, voter_id_group;
        console.debug(event);
        if (req.status === 404) {
          return console.debug(req);
        } else {
          voter_details = JSON.parse(req.responseText);
          console.debug(req.responseText);
          ref = results_list.children;
          results1 = [];
          for (j = 0, len1 = ref.length; j < len1; j++) {
            child = ref[j];
            voter_id_group = child.dataset.voteridgroup;
            voter_id = child.dataset.voterid;
            if (voter_id_group === ("" + block_to_look_up)) {
              results1.push(child.innerHTML = "" + voter_details[voter_id]);
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        }
      });
    };
    results = [];
    for (block_to_look_up in blocks_to_look_up) {
      if (!hasProp.call(blocks_to_look_up, block_to_look_up)) continue;
      _ = blocks_to_look_up[block_to_look_up];
      req = new XMLHttpRequest;
      fn(req, results_list, block_to_look_up, year);
      details_year_json_url = "data/voter_info_list_grouped_by_voterid-" + block + "-year-" + year + ".json";
      req.open("GET", details_year_json_url, true);
      req.send();
      results.push((function() {
        var j, len1, ref, results1;
        ref = results_list.children;
        results1 = [];
        for (j = 0, len1 = ref.length; j < len1; j++) {
          child = ref[j];
          voter_id_group = child.dataset.voteridgroup;
          if (voter_id_group === ("" + block_to_look_up)) {
            results1.push(child.innerHTML = "(one moment please)");
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      })());
    }
    return results;
  };

  terminating_key = "";

  gather_voterids = function(trie_to_voterids, weights, current_depth, max_depth) {
    var i, len, ref, remaining_ch, results, subtrie, voterid;
    if (!trie_to_voterids) {
      return;
    }
    if (terminating_key in trie_to_voterids) {
      ref = trie_to_voterids[terminating_key];
      for (i = 0, len = ref.length; i < len; i++) {
        voterid = ref[i];
        if (!(voterid in weights)) {
          weights[voterid] = 0;
        }
        weights[voterid] += max_depth - current_depth;
      }
    }
    if (current_depth < max_depth) {
      results = [];
      for (remaining_ch in trie_to_voterids) {
        subtrie = trie_to_voterids[remaining_ch];
        if (remaining_ch !== terminating_key) {
          if (weights.length < 50) {
            results.push(gather_voterids(subtrie, weights, current_depth + 1, max_depth));
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

  timeout_function = null;

  try_search = function(widget, trie_to_voterids, results_list, year) {
    var ch, i, j, k, len, len1, len2, li, m, pair, ref, stem, t, v, voter_id_with_weights, voterid_to_weight_map, widget_text, word;
    if (timeout_function) {
      t = timeout_function;
      timeout_function = null;
      window.clearTimeout(t);
    }
    widget_text = widget.value.toLocaleLowerCase();
    if (widget_text.length < 3) {
      return;
    }
    voterid_to_weight_map = new Array;
    ref = widget_text.split(/ +/);
    for (i = 0, len = ref.length; i < len; i++) {
      word = ref[i];
      stem = trie_to_voterids;
      for (j = 0, len1 = word.length; j < len1; j++) {
        ch = word[j];
        stem = stem[ch];
        if (!stem) {
          break;
        }
      }
      gather_voterids(stem, voterid_to_weight_map, 0, 3);
    }
    voter_id_with_weights = (function() {
      var results;
      results = [];
      for (k in voterid_to_weight_map) {
        if (!hasProp.call(voterid_to_weight_map, k)) continue;
        v = voterid_to_weight_map[k];
        results.push([k, v]);
      }
      return results;
    })();
    voter_id_with_weights.sort(function(l, r) {
      return l[1] - r[1];
    });
    while (results_list.lastChild) {
      results_list.removeChild(results_list.lastChild);
    }
    for (m = 0, len2 = voter_id_with_weights.length; m < len2; m++) {
      pair = voter_id_with_weights[m];
      li = document.createElement("LI");
      li.setAttribute("value", pair[1]);
      li.setAttribute("data-voterid", pair[0]);
      li.setAttribute("data-voteridgroup", Math.floor(pair[0] / voter_id_block_division));
      li.appendChild(document.createTextNode("(voter id #" + pair[0] + ")"));
      results_list.appendChild(li);
    }
    return (function(voter_id_with_weights, results_list, year) {
      var render_result;
      render_result = function() {
        return show_results_for_year_and_voteridblock(results_list, voter_id_with_weights, year);
      };
      return timeout_function = window.setTimeout(render_result, 180);
    })(voter_id_with_weights, results_list, year);
  };

  retrieve_year_request = null;

  document.choose_year_and_activate_search = function(widget, search_widget_id, results_to_widget_id, progress_to_widget_id) {
    var progress_bar, r, results_to_widget, search_bar, year, year_json_url;
    console.debug("choosing year");
    year = widget.value;
    if (retrieve_year_request) {
      r = retrieve_year_request;
      r.abort();
    }
    search_bar = document.getElementById(search_widget_id);
    results_to_widget = document.getElementById(results_to_widget_id);
    progress_bar = document.getElementById(progress_to_widget_id);
    year_json_url = "data/trie-to-voterid-for-birth-year-" + year + ".json";
    retrieve_year_request = new XMLHttpRequest;
    (function(retrieve_year_request, progress_bar, results_to_widget, year) {
      retrieve_year_request.addEventListener("progress", function(event) {
        var percent_complete;
        if (event.lengthComputable) {
          console.log("progress");
          percent_complete = event.loaded / event.total;
          return progress_bar.innerHTML = "loaded " + (Math.floor(percent_complete * 10000 / 100)) + "%";
        } else {
          console.log("no progress");
          return progress_bar.innerHTML = "...loading";
        }
      });
      return retrieve_year_request.addEventListener("load", function(event) {
        var trie_to_voterids;
        console.log("loaded");
        console.log(retrieve_year_request);
        search_bar.disabled = true;
        if (retrieve_year_request.readyState === 1) {
          return progress_bar.innerHTML = "requesting";
        } else if (retrieve_year_request.readyState === 2) {
          return progress_bar.innerHTML = "receiving";
        } else if (retrieve_year_request.readyState === 3) {
          return progress_bar.innerHTML = "loading ...";
        } else if (retrieve_year_request.readyState === 4) {
          if (retrieve_year_request.status === 404) {
            return progress_bar.innerHTML = "year not valid";
          } else {
            progress_bar.innerHTML = "almost done...";
            trie_to_voterids = JSON.parse(retrieve_year_request.responseText);
            if (!trie_to_voterids) {
              return progress_bar.innerHTML = "internal error";
            } else {
              progress_bar.innerHTML = "ready to search";
              search_bar.disabled = false;
              (function(trie_to_voterids, search_bar, results_to_widget) {
                return search_bar.oninput = function() {
                  return try_search(search_bar, trie_to_voterids, results_to_widget, year);
                };
              })(trie_to_voterids, search_bar, results_to_widget);
              return search_bar.focus();
            }
          }
        } else {
          console.warn("unknown readyState");
          return console.warn(retrieve_year_request);
        }
      });
    })(retrieve_year_request, progress_bar, results_to_widget, year);
    retrieve_year_request.open("GET", year_json_url, true);
    return retrieve_year_request.send();
  };

}).call(this);
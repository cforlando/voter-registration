voter-registration
==================

A frictionless, opinionated registration tool.  Look up your current
registration, and make changes if desired and register if you aren't
already registered.

aspirational overview
---------------------

A simple form should search and populate a registration form. By filling it
out, people can register anew or change an existing registration.

Type birth-date, then start filling name, address, et c, and entered details
cause the page to suggest existing registrations to fill the entire form. User
can decide there's nothing to fix and feel confident they're already
registered, or they can change what's populated or fill out details for new
registration. When finished, we ask them to sign with the pointer and we caputure
the signature. Then, we print the form locally or in some mailroom and make it
ready to deliver to the Florida Dept of Elections.

A single piece of paper, one sided that folds (with instructions for close (for
citizen) and open (for govt)) into a self-contained postable letter is perfect.
If we can pre-pay the postage, even better. (Get sponsorship for this!)

implementation details
----------------------

We don't have a database on server, we assume. We know how we're going to
access the data, so we pre-compute the indexing and move the search into the
browser in a Trie data-structure and on server's disk as a directory structure.

We make a map of numeric voter IDs to voter details.

We make a map of personal details (like name, address) to voter IDs.

By typing a few letters of personal details, we can then search for the
closest-matching voterids.

That means Trie descent for each part of personal details, then breadth-first
search with limit for remaining. Voter IDs that show up in many searches have
matched many times, and are likely matches for the user.  Then, go through the
most-returned voter IDs, and download voterid-to-details maps, and display
details as suggestion to auto-fill.

Birth date is something not likely to change over a person's lifetime and
serves as a good way to distribute massive data into managable, downloadable
snippets. So, we ask for birth date first and use that in all remaining
look-ups.

The existing registration data is a public record, but the FLDOE doesn't make
it trivial to get. We use [a third party who has done the work of requesting
data](http://flvoters.com/).

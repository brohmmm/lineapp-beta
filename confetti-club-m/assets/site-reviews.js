/* Reviews are built before marquee.js measures the rows. All reviews are placeholders for this test page (data-ph="review"). */
(function () {
  'use strict';
  var A = [
    ['Aoife M.', 'Dublin', 'App Store', 5, 'av-01', 'Set moved at 22:41 and my phone knew before the screens did. Chips with the spare 15 minutes, then front left for the whole set.'],
    ['u/bucket_hat_barry', 'Manchester', 'Reddit r/festivals', 0, 'av-02', 'Honestly expected another PDF line-up with a logo on it. The app\'s clash screen picked between two sets for me and I didn\'t regret it. Weird feeling.'],
    ['Bartek W.', 'Gdańsk', 'Google Play', 2, 'BW', 'Map took ages to load on 4G at the gate. Once it loaded it was fine, but first impressions matter, lads.'],
    ['@zuza.glitter', 'Łódź', 'TikTok comment', 0, 'av-04', 'i was a blue reindeer for two days and my crew found me by the food trucks on 4% battery. iconic'],
    ['Priya K.', 'Leeds', 'App Store', 4, 'av-05', 'Really good. Set times moved twice on Saturday and the app knew first. One star off because dark mode is very dark in full sun.'],
    ['Cian O\'B.', 'Galway', 'X', 0, 'av-13', 'Battery at 61% on day two. Last year\'s festival app ate my phone by lunch. Small thing. Massive thing.'],
    ['Hannah R.', 'Bristol', 'App Store', 5, 'HR', 'Swiped the artist feed on the tram in. Found a band I\'d never heard of. My favourite set of the weekend, River Lawn, 17:30.'],
    ['Daniel M.', 'Birmingham', 'Google Play', 3, 'av-16', 'Pushes were useful, not spam. But I wanted to drop my own pin for our tent spot and couldn\'t. Fix that and it\'s five stars.'],
    ['Niamh F.', 'Cork', 'App Store', 5, 'av-09', 'The map started in fog and we spent Saturday afternoon racing to uncover it. Found a tiny stage by the river nobody else knew about.'],
    ['Josh T.', 'Leeds', 'X', 0, 'av-11', 'Headliner moved from 23:15 to 23:30. The app told me at 22:41. Proper.'],
    ['Siobhán K.', 'Dublin', 'Google Play', 5, 'av-07', 'Lost my mates at 00:50, phone on 9%. Their last spot was on the map: River Lawn, by the big tree. Found them in six minutes.'],
    ['u/deadphone_dave', 'Cardiff', 'Reddit r/festivals', 0, 'DD', 'Grumpy take: the night bus info was right but the font was tiny. Still beats squinting at a JPEG of a timetable.']
  ];
  var B = [
    ['Michał R.', 'Festival director · Kraków', 'e-mail to us', 0, 'av-06', 'I used to defend the app budget every spring. This year the sponsor paid for it, and half the package stayed with us.'],
    ['Darren W.', 'Production manager · Manchester', 'LinkedIn', 0, 'av-08', 'Set times moved three times on Saturday. I changed them once in the panel and every phone had it before the stage manager finished the radio call.'],
    ['Rafał D.', 'Bar manager · Gdańsk', 'LinkedIn', 0, 'av-15', 'The zone push at 21:00 said "shortest queue at the bar, now". It was, for about four minutes. Then it wasn\'t. Good problem.'],
    ['Julia M.', 'Volunteer coordinator · Łódź', 'Trustpilot', 3, 'JM', 'Volunteers stopped hearing the same five questions. Setup took longer than the promised week for us, partly our fault, partly not.'],
    ['Seán O\'C.', 'Marketing lead · Dublin', 'e-mail to us', 0, 'SO', 'The Monday report is the first deck I didn\'t have to build myself. How many saw the logo, how many times, place by place. I forwarded it as it was.'],
    ['Mark J.', 'Partnerships, ticketing partner · Bristol', 'Trustpilot', 5, 'av-10', 'Connecting our ticket data took an afternoon. The festival kept its audience, we kept ours. Rare to meet an app company that doesn\'t try to own everything.'],
    ['Anna Z.', 'Head of production, city festival · Warsaw', 'LinkedIn', 0, 'av-03', 'A storm cell over the park at 21:37. One message from the panel to every phone with the app, and the stewards saying the same. No rumours.']
  ];
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function card(r, org) {
    var li = document.createElement('li'); li.setAttribute('data-ph', 'review');
    var av = /^av-/.test(r[4]) ? '<img src="assets/av/' + r[4] + '.jpg" alt="" loading="lazy">' : '<span class="ini" aria-hidden="true">' + r[4] + '</span>';
    var st = r[3] ? '<span class="st' + (r[3] <= 3 ? ' lo' : '') + '" aria-label="' + r[3] + ' of 5 stars">' + '★★★★★'.slice(0, r[3]) + '<span style="opacity:.3">' + '★★★★★'.slice(0, 5 - r[3]) + '</span></span>' : '';
    li.innerHTML = '<div class="rcard' + (org ? ' org' : '') + (r[3] && r[3] <= 3 ? ' grump' : '') + '"><p>' + esc(r[5]) + '</p><div class="by">' + av + '<div><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></div><span class="src">' + st + esc(r[2]) + '</span></div></div>';
    return li;
  }
  var a = document.getElementById('rowA'), b = document.getElementById('rowB');
  if (a) A.forEach(function (r) { a.appendChild(card(r)); });
  if (b) B.forEach(function (r) { b.appendChild(card(r, true)); });
})();

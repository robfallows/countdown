import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Timers } from '/imports/api/Timers';

import './main.html';

Template.showTimers.onCreated(function() {
  // Set up a reactiveVar to hold a value which changes every second.
  this.timer = new ReactiveVar();
  // Set the reactiveVar to a new value every second.
  // An interesting side-effect of this design is that it doesn't really matter what this
  // setInterval value is - the timers will always count down by the right amount. On the other
  // hand, you don't want to re-run the helpers too frequently.
  Meteor.setInterval(() => {
    this.timer.set(new Date().valueOf());
  }, 1000);
});

Template.showTimers.helpers({

  // Return a list of all current timers.
  timers() {
    // something to nicely format the countdown time for this helper.
    function toHms(n) {
      const h = Math.floor(n / 3600);
      const m = Math.floor((n - h * 3600) / 60);
      const s = Math.floor(n % 60);
      const mm = m < 10 ? `0${m}` : `${m}`;
      const ss = s < 10 ? `0${s}` : `${s}`;
      return `${h}:${mm}:${ss}`;
    }
    // Get the template's reactiveVar to force a re-run of the helper every interval.
    Template.instance().timer.get();
    return Timers.find().map(doc => {
      let remains = doc.remaining;
      if (doc.active === 1) {
        remains = Math.max(0, doc.ends.valueOf() - new Date().valueOf());
        if (remains === 0) {
          Timers.update(doc._id, { $set: { active: 0, remaining: 0 } } );
        }
      }
      // Return a doc with a formatted time remaining.
      doc.remains = toHms(parseInt(remains / 1000, 10));
      return doc;
    });
  },

  // The following helpers are just to make things render more nicely.
  buttonLabel() {
    return this.active === 1 ? '||' : '>';
  },

  buttonClass() {
    return this.active === 1 ? 'pause' : 'resume';
  },

  notFinished() {
    return this.remaining !== 0;
  },
});

Template.showTimers.events({
  // Add a new countdown timer (I set this to 1 hour).
  'click button.new'(event, instance) {
    const ends = new Date(new Date().valueOf() + 3600000);
    Timers.insert({ends, active: 1, remaining: null});
  },

  // Pause a countdown timer.
  'click button.pause'(event, instance) {
    const remaining = Math.max(0, Timers.findOne(this._id).ends.valueOf() - new Date().valueOf());
    Timers.update(this._id, { $set: { ends: null, active: 0, remaining } } );
  },

  // Resume a countdown timer.
  'click button.resume'(event, instance) {
    const ends = new Date(new Date().valueOf() + Timers.findOne(this._id).remaining);
    Timers.update(this._id, { $set: { ends, active: 1, remaining: null } } );
  },
});


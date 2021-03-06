import React from 'react'
import TimeFormatterMixin from './TimeFormatterMixin'

const TimeLabel = React.createClass({

	mixins: [ TimeFormatterMixin ],
	
	render: function() {
		var classes = "audio-time pull-right";
		if (this.props.seek == undefined || !this.props.duration) {
			return (
				<span></span>
				// return (<span>&nbsp;</span>);
				// <span className={classes}>00:00 / 00:00</span>
			);
		}

		var seek = this.secondsToTime(this.props.seek);
		var duration = this.secondsToTime(this.props.duration);
		return (
			<span className={classes}>{seek} / {duration}</span>
		);
	}

});

export default TimeLabel
import React from 'react'
import classnames from 'classnames'
import { MenuItem, Glyphicon } from 'react-bootstrap'

const SongItem = React.createClass({
	render: function() {

		var currentSongIndex = this.props.currentSongIndex;
		var isSelected = this.props.currentSongIndex == this.props.eventKey;
		var components = [];

		if (isSelected && this.props.isPlaying) {
			components[0] = <Glyphicon className="audio-song-item-icon active" glyph="play" />;
		} else {
			components[0] = <span className="audio-song-item-not-selected"></span>;
		}

		components[1] = <span className="audio-song-item-label" >{this.props.name}</span>;
		
		var classes = classnames({
  		'audio-song-item': true,
  		'active': isSelected,
		});

		return (
			<MenuItem className={classes} eventKey={this.props.eventKey} onClick={this.props.onSongItemClick} > 
				{ components }
			</MenuItem>
		);
	}
})

export default SongItem
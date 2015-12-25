import React from 'react'
import { Label } from 'react-bootstrap'

const NameLabel = React.createClass({
	render: function() {
		return (
			<span className="audio-name-label pull-left">{this.props.name}</span>
		);
	}
})

export default NameLabel
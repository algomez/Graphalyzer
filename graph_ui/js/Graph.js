/**
 * Graph.js
 *
 * @author Andrew Bowler, Alberto Gomez-Estrada
 */

'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var Vis = require('vis');

var Graph = React.createClass({
  getInitialState: function() {
    return {
      clusters: [],
      clusterIndex: 0,
      lastZoomLevel: 0
    };
  },

  componentDidMount: function() {
    var element = ReactDOM.findDOMNode(this);
    this.setState({
      network: new Vis.Network(element, this.props.graphData, this.props.options)
    });
  },

  hasFilterOptions: function() {
    if (this.props.filter) {
      return this.props.filter.property && this.props.filter.option;
    } else return false;
  },

  /**
   * If there are any filter options passed in, perform filtering. Otherwise do nothing.
   */
  doFilter: function() {
    if (this.hasFilterOptions() && !this.isGraphEmpty()) {
      var property = this.props.filter.property;
      var nodeIDs = this.props.graphData.nodes.get({returnType: 'Object'});
      var propertyToFilter;
      switch (this.props.filter.option) {
        case 'Remove Nodes Without':
          for (var nodeID in nodeIDs) {
            if (this.props.graphData.nodes.get(nodeID)[property])
              this.props.graphData.nodes.update({id: nodeID, color: 'red'});
            else 
              this.props.graphData.nodes.update({id: nodeID, color: 'rgba(150,150,150,0.50)'});
          }
        case '>':
          for (var nodeID in nodeIDs) {
            propertyToFilter = this.props.graphData.nodes.get(nodeID)[property];
            if (parseInt(propertyToFilter) > this.props.filter.value)
              this.props.graphData.nodes.update({id: nodeID, color: 'red'});
            else 
              this.props.graphData.nodes.update({id: nodeID, color: 'rgba(150,150,150,0.50)'});
          }
          break;
        case '=':
          for (var nodeID in nodeIDs) {
            propertyToFilter = this.props.graphData.nodes.get(nodeID)[property];
            if (parseInt(propertyToFilter) == this.props.filter.value)
              this.props.graphData.nodes.update({id: nodeID, color: 'red'});
            else 
              this.props.graphData.nodes.update({id: nodeID, color: 'rgba(150,150,150,0.50)'});
          }
          break;
        case '<':
          for (var nodeID in nodeIDs) {
            propertyToFilter = this.props.graphData.nodes.get(nodeID)[property];
            if (parseInt(propertyToFilter) < this.props.filter.value)
              this.props.graphData.nodes.update({id: nodeID, color: 'red'});
            else 
              this.props.graphData.nodes.update({id: nodeID, color: 'rgba(150,150,150,0.50)'});
          }
          break;
        default:
          break;
      }
    }
  },

  makeClusters: function(scale) {
    var clusterOptionsByData = {
      processProperties: function (clusterOptions, childNodes) {
        this.setState(function(previousState, currentProps) {
          return {
            clusterIndex: previousState.clusterIndex + 1
          };
        });
        var childrenCount = 0;
        for (var i = 0; i < childNodes.length; i++) {
          childrenCount += childNodes[i].childrenCount || 1;
        }
        clusterOptions.childrenCount = childrenCount;
        clusterOptions.label = "# " + childrenCount + "";
        clusterOptions.font = {size: childrenCount*5+30}
        clusterOptions.id = 'cluster:' + this.state.clusterIndex;
        clusters.push({id:'cluster:' + this.state.clusterIndex, scale:scale});
        return clusterOptions;
      },
      clusterNodeProperties: {borderWidth: 3, shape: 'dot', font: {size: 30}}
    }
    this.state.network.clusterOutliers(clusterOptionsByData);
  },

  openClusters: function(scale) {
    var newClusters = [];
    for (var i = 0; i < self.state.clusters.length; i++) {
      if (self.state.clusters[i].scale < scale) {
        self.state.network.openCluster(self.state.clusters[i].id);
        self.setState({
          lastClusterZoomLevel: scale
        });
      }
      else {
        newClusters.push(self.state.clusters[i])
      }
    }
    self.setState({
      clusters: newClusters
    });
  },

  isGraphEmpty: function() {
    return this.props.graphData.nodes.length == 0 && this.props.graphData.edges.length == 0;
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return (this.props.graphData != nextProps.graphData) || 
      (this.props.filter != nextProps.filter) || 
      (this.props.totalChunks != nextProps.currentChunk);
  },

  componentDidUpdate: function() {
    var self = this;
    this.state.network.setData({
      nodes: this.props.graphData.nodes,
      edges: this.props.graphData.edges
    });

    this.doFilter();

    this.state.network.on('selectNode', function(event) {
      var nodeID = event.nodes[0];
      var node = self.state.network.body.data.nodes.get(nodeID);
      self.props.updateSelectedNode(node);
    });

    this.state.network.on('deselectNode', function(event) {
      self.props.updateSelectedNode({});
    });

    // Called when Vis is finished drawing the graph
    this.state.network.on('afterDrawing', function(event) {
      self.props.logger('Graph finished drawing');
      self.setState({
        lastZoomLevel: self.state.network.getScale()
      });
    });

    this.state.network.on('zoom', function(params) {
      if (params.scale < self.state.lastZoomLevel * self.props.clusterFactor) {
        if (params.direction == '-') {
          self.makeClusters(params.scale);
          self.setState({
            lastZoomLevel: params.scale
          });
        }
      } else
        self.openClusters(params.scale);
    });
  },

  getDefaultProps: function() {
    return {
      clusterFactor: 1.1,
      options: {
        nodes: {
          color: '#97C2FC',
          borderWidth: 0,
          borderWidthSelected: 1,
          shape: 'dot',
          size: 10
        },
        edges: {
          arrows: {
            to: {
              scaleFactor: 0.5
            }
          },
          color: '#848484',
          smooth: false
        },
        physics: false,
        interaction: {
          dragNodes: false,
        }
      }
    }
  },

  getInitialState: function() {
    return {
      network: {}
    };
  },

  render: function() {
    return (<div></div>);
  }
});

module.exports = Graph;

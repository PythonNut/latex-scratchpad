import './App.css';
import React, { Component } from 'react';
import MathJax from '@pythonnut/react-mathjax';
import {latexParser, isOk} from "latex-parser";

class App extends Component {
  constructor(props) {
    super(props);
    this.socket = new WebSocket('ws://localhost:9998');
    this.socket.onmessage = (event) => {
      this.setState({value: event.data});
      console.log(event.data);
    };
    this.state = {value: ''};
    this.handleChange = this.handleChange.bind(this);

    this.parse = "";
    this.text = "";
    this.math = "";
  }
  
  parseassembler(parse) {
    var text = '';
    if (Array.isArray(parse)) {
      text = '{';
      for (var i in parse) {
        text += this.parseassembler(parse[i]);
      }
      text += '}';
      return text;
    }
    
    switch (parse.type) {
    case 'TeXEnv':
      text = '\\begin{' + parse.name + '}';
      for (var i in parse.latex) {
        text += this.parseassembler(parse.latex[i]);
      }
      text += '\\end{' + parse.name + '}';
      break;
    case 'TeXRaw':
      text = parse.text;
      break;
    case 'TeXComm':
      text = '\\' + parse.name;
      for (var i in parse.arguments) {
        text += this.parseassembler(parse.arguments[i]);
      }
      break;
    case 'FixArg':
      text = '{';
      for (var i in parse.latex) {
        text += this.parseassembler(parse.latex[i]);
      }
      text += '}';
      break;
    case 'OptArg':
      text = '[';
      for (var i in parse.latex) {
        text += this.parseassembler(parse.latex[i]);
      }
      text += ']';
      break;
    case 'Dollar':
      text = '$';
      for (var i in parse.latex) {
        text += this.parseassembler(parse.latex[i]);
      }
      text += '$';
      break;
    }
    return text;
  }
  
  handleChange(event) {
    this.setState({value: event.target.value});
    this.socket.send(event.target.value);
    var parse = latexParser.parse(event.target.value);
    this.parse = '';

    var environment = false;
    var environment_type = '';
    var environment_contents = [];
    var content;

    if (isOk(parse)) {
      this.math = [];
      for (var i in parse.value) {
        if (environment) {
          if (parse.value[i].type == "TeXComm" && parse.value[i].name == "]" && environment_type == '') {
            environment = false;
            content = environment_contents.join('\n')
            this.math.push(
              <MathJax.Node>{content}</MathJax.Node>
            );
          }
          environment_contents.push(this.parseassembler(parse.value[i]))
          continue
        }
        if (parse.value[i].type == "Dollar" && "latex" in parse.value[i]) {
          content = this.parseassembler(parse.value[i].latex)
          this.math.push(
            <MathJax.Node inline>{content}</MathJax.Node>
          )
        } else {
          if (parse.value[i].type == "TeXComm" && parse.value[i].name == "[") {
            environment = true;
            environment_type = '';
            environment_contents = [];
          }
          else if (parse.value[i].type == "TeXEnv") {
            environment = true;
            environment_type = parse.value[i].name;
            environment_contents = [];
            content = this.parseassembler(parse.value[i])
            this.math.push(
              <MathJax.Node>{content}</MathJax.Node>
            );
          }
          else {
            this.math.push(this.parseassembler(parse.value[i]) + '\n');
          }
        }
        this.parse += JSON.stringify(parse.value[i]) + "\n";
      }
    }
  }

  render() {
    return (
      <div>
          <textarea value={this.state.value} onChange={this.handleChange} />
        <pre>
        {this.parse}
        </pre>
        <MathJax.Context input='tex'>
        <div>
          {this.math}
        </div>
        </MathJax.Context>
        </div>
    );
  }
}

export default App;

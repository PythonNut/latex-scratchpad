import './App.css';
import React, { Component } from 'react';
import MathJax from '@pythonnut/react-mathjax';
import {latexParser, isOk} from "latex-parser";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
    this.handleChange = this.handleChange.bind(this);

    this.parse = "";
    this.text = "";
    this.math = "";
  }
  
  parseassembler(parse) {
    if (Array.isArray(parse)) {
      return parse.map(this.parseassembler, this).join('');
    }
    
    switch (parse.type) {
    case 'TeXRaw':
      return parse.text;
    case 0:
      let sym_args = this.parseassembler(parse.arguments);
      return `${parse.symbol}${sym_args}`;
    case 'TeXEnv':
      let contents = this.parseassembler(parse.latex);
      return `\\begin{${parse.name}}${contents}\\end{${parse.name}}`;
    case 'TeXComm':
      let args = this.parseassembler(parse.arguments);
      return `\\${parse.name}${args}`;
    case 'FixArg':
      return `{${this.parseassembler(parse.latex)}}`;
    case 'OptArg':
      return `[${this.parseassembler(parse.latex)}]`;
    default:
      console.error("Encountered unknown parse element: ", parse);
      return '';
    }
  }
  
  handleChange(event) {
    var parse = latexParser.parse(event.target.value);
    var environment = false;
    var environment_contents = [];

    this.setState({value: event.target.value});
    this.parse = '';
    this.text = '';

    if (isOk(parse)) {
      this.math = [];
      for (let item of parse.value) {
        if (environment) {
          if (item.type == "TeXComm" && item.name == "]") {
            let content = environment_contents.join('');
            this.math.push(
                <MathJax.Node>{content}</MathJax.Node>
            );
            this.text += `\\[${content}\\]`;
            environment = false;
          }
          else {
            environment_contents.push(this.parseassembler(item));
          }
        }
        else if (item.type == "Dollar") {
          let content = this.parseassembler(item.latex);
          this.math.push(
              <MathJax.Node inline>{content}</MathJax.Node>
          );
          this.text += `\$${content}\$`;
        }
        else if (item.type == "TeXComm" && item.name == "[") {
          environment = true;
          environment_contents = [];
        }
        else if (item.type == "TeXEnv") {
          let content = this.parseassembler(item);
          this.math.push(
              <MathJax.Node>{content}</MathJax.Node>
          );
          this.text += content;
          environment = true;
          environment_contents = [];
        }
        else {
          let content = this.parseassembler(item);
          this.math.push(content);
          this.text += content;
        }
        this.parse += JSON.stringify(item) + "\n";
      }
    }
  }

  render() {
    return (
      <React.Fragment>
        <textarea value={this.state.value} onChange={this.handleChange} />
        <MathJax.Context input='tex'>
          <div>
            {this.math}
          </div>
        </MathJax.Context>
      </React.Fragment>
    );
  }
}

export default App;

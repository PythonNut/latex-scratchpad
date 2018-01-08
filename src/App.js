import './App.css';
import React, { Component } from 'react';
import MathJax from '@pythonnut/react-mathjax';
import {latexParser, isOk} from "latex-parser";
import AceEditor from 'react-ace';

import 'brace/mode/latex';
import 'brace/theme/solarized_dark';
import 'brace/snippets/latex';
import 'brace/ext/language_tools';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      math: '',
      parse: '',
      text: ''
    };
    this.handleChange = this.handleChange.bind(this);
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
    var latex_parse = latexParser.parse(event);
    var environment = false;
    var environment_contents = [];

    this.setState({value: event});

    if (isOk(latex_parse)) {
      let math = [];
      let parse = [];
      let text = '';
      for (let item of latex_parse.value) {
        if (environment) {
          if (item.type == "TeXComm" && item.name == "]") {
            let content = environment_contents.join('');
            math.push(
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
          math.push(
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
          math.push(
              <MathJax.Node>{content}</MathJax.Node>
          );
          this.text += content;
          environment = true;
          environment_contents = [];
        }
        else {
          let content = this.parseassembler(item);
          math.push(content);
          this.text += content;
        }
        this.parse += JSON.stringify(item) + "\n";
      }
      this.setState({
        math: math,
        parse: parse,
        text: text
      });
    }
  }

  render() {
    return (
      <React.Fragment>
        <AceEditor
      height=""
      width=""
      setOptions={{printMargin: false}}
      mode="latex"
      theme="solarized_dark"
      name="ace_editor"
          enableBasicAutocompletion={true}
    enableLiveAutocompletion={true}
      enableSnippets={true}
      value={this.state.value}
      onChange={this.handleChange}
        />
        <MathJax.Context input='tex'>
          <div id="latex_output">
            {this.state.math}
          </div>
        </MathJax.Context>
      </React.Fragment>
    );
  }
}

export default App;

# aiexe

Welcome to aiexe, the cutting-edge command-line interface (CLI) tool that integrates powerful AI capabilities directly into your terminal. Designed for developers, tech enthusiasts, and anyone interested in AI-powered automation, aiexe provides an easy-to-use yet robust platform for executing complex tasks with just a few commands. Harness the power of OpenAI's GPT models, Anthropic's Claude models, Ollama's versatile llama3 models, and Gemini models to boost your productivity and enhance your decision-making processes.

## Table of Contents
1. [Features](#features)
2. [Getting Started](#getting-started)
3. [Installation](#installation)
   - [Windows Installation](#windows-installation)
   - [macOS Installation](#macos-installation)
   - [Linux Installation](#linux-installation)
4. [Usage](#usage)
5. [Safety Features](#safety-features)
6. [Contribute](#contribute)
7. [Support](#support)
8. [Subscribe](#subscribe)

## Features

- **Seamless Integration**: Easily integrate with OpenAI, Anthropic, Ollama, and Gemini AI models.
- **Flexible Commands**: Execute a variety of AI-driven tasks directly from your CLI.
- **Cross-Platform Compatibility**: Works on any system with Python support, including Linux, macOS, and Windows.

## Getting Started

### Prerequisites

Before you begin, ensure you have `npm` and Python installed on your system.

## Installation

### Windows Installation
1. Download and install Node.js from [nodejs.org](https://nodejs.org).
2. Download and install Python from [python.org](https://www.python.org/).
3. Run PowerShell as administrator and execute the following command to set the execution policy:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
   ```
   This command allows scripts signed by a trusted publisher to be run and avoids interruptions during the installation of `aiexe`. Be cautious with this setting, as it can potentially expose your system to security risks if scripts from untrusted sources are executed.
4. Install `aiexe` globally using npm:
   ```bash
   npm install aiexe -g
   ```
5. Start using `aiexe` by entering the command:
   ```bash
   aiexe
   ```

### macOS Installation
1. Download and install Node.js from [nodejs.org](https://nodejs.org).
2. Download and install Python from [python.org](https://www.python.org/).
3. Install `aiexe` globally using npm:
   ```bash
   sudo npm install aiexe -g
   ```
4. Start using `aiexe` by entering the command:
   ```bash
   aiexe
   ```

### Linux Installation
1. Download and install Node.js from [nodejs.org](https://nodejs.org).
2. Download and install Python from [python.org](https://www.python.org/).
3. Install `aiexe` globally using npm:
   ```bash
   sudo npm install aiexe -g
   ```
4. Start using `aiexe` by entering the command:
   ```bash
   aiexe
   ```

## Usage

Once you have configured your environment and installed `aiexe`, you can start using it to execute AI commands. Here's an example of how to use the CLI:
```bash
aiexe "Convert all jpg files in the /Users/kst/Downloads/data folder to black and white and place them in the /Users/kst/Downloads/data/grayscalephoto folder. If the folder does not exist, make it."
```

![screen](https://blog.kakaocdn.net/dn/bCf0gD/btsHd8DaTm7/9n0V2nKIWK26sFJ4BkKXak/img.jpg)

## Safety Features

To ensure that generated code does not negatively impact your system or external environment, `aiexe` requires manual confirmation from the user before executing any commands. This feature enhances security by allowing you to evaluate and approve commands before they are run. Please be cautious and make sure you understand the purpose and implications of any AI-generated code before you use it.

**Disclaimer**: The user assumes full responsibility for the use of `aiexe`. Ensure that you operate in a safe environment and carefully consider the intent and consequences of the code you execute.

## Contribute

Contributions are welcome! If you have improvements or bug fixes, feel free to fork the repository and submit a pull request.

## Support

If you need help or have any questions, please open an issue in the GitHub repository.

## Subscribe

Explore more exciting content about AI and coding on my YouTube channel [CodeTeller](https://www.youtube.com/@codeteller). Don't forget to subscribe for the latest updates and tutorials!

Harness the potential of `aiexe` and transform your terminal into a powerful AI command center!

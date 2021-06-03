import os

x = [file for file in os.listdir() if file.split(".")[-1] == "js"]

for file in x:
    # run the command to obfuscate
    os.system(f"javascript-obfuscator {file} --output {file}")
    print(f"{file} --> has been obfuscated")
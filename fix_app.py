import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

pattern = r"      let topClusters.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?const orderBookImbalance = totalAsks > 0 \? totalBids \/ totalAsks : 1\.0;"
replacement = "      const topClusters = extractTopClusters(heatmapData, curPrice);\n      const orderBookImbalance = computeWeightedImbalance(orderBook, dualDepth, dualTicker);"

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(new_content)

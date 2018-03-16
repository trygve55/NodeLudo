import math

width = 6000
height = 6000
x = width/2
y = height/2

size = 400
players = 8
depth = 6
blockSize = 0.7
outFactor = 0
offsetFactor = 1 #0.926
offset = -0.16

colors = [[255,0,0],[0,255,0],[200,200,0],[0,0,80],[150,0,200],[50,0,200],[200,100,0],[0,0,255]]
strokeWidth = str(4)

print('<body>\n\t<svg viewBox="0 0 ' + str(width) + ' ' + str(height) + '">')
print("\t\t//center")
points = ""
for i in range(players):
    points += str(x+math.sin((2*math.pi)*((float(0.5 + i)/players)))*size)
    points += ","
    points += str(y+math.cos((2*math.pi)*(float(0.5 + i)/players))*size)
    points += " "
print('\t\t<polygon points="' + points +'"stroke="black" stroke-width="' + strokeWidth +'" fill="rgb(20,20,20)"></polygon>')

print("\t\t//endgame")

for i in range(players):
    points = ""
    points += str(x+math.sin((2*math.pi)*((float(-0.5 + i)/players)))*size)
    points += ","
    points += str(y+math.cos((2*math.pi)*(float(-0.5 + i)/players))*size)
    points += " "
    points += str(x+math.sin((2*math.pi)*((float(-0.5 + i)/players)))*size*2)
    points += ","
    points += str(y+math.cos((2*math.pi)*(float(-0.5 + i)/players))*size*2)
    points += " "
    points += str(x+math.sin((2*math.pi)*((float(i+0.5)/players)))*size*2)
    points += ","
    points += str(y+math.cos((2*math.pi)*(float(i+0.5)/players))*size*2)
    points += " "
    points += str(x+math.sin((2*math.pi)*((float(i+0.5)/players)))*size)
    points += ","
    points += str(y+math.cos((2*math.pi)*(float(i+0.5)/players))*size)
    points += " "
    print('\t\t<polygon points="' + points +'"stroke="black" stroke-width="' + strokeWidth +'" fill="rgb(' +
          str(colors[i][0]) + ',' + str(colors[i][1]) + ',' + str(colors[i][2]) + ')"></polygon>')

for j in range(depth):

    innerMult = 1.09 if outFactor == 0 else 1.5
    
    for i in range(players):
        points = ""
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.sin(-math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize/2)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.cos(-math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize/2)
        points += " "
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.sin(math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize/2)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.cos(math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize/2)
        points += " "
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.sin(math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize/2)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.cos(math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize/2)
        points += " "
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.sin(-math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize/2)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.cos(-math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize/2)
        print('\t\t<polygon points="' + points + '"stroke="black" stroke-width="' + strokeWidth + '" fill="rgb(' + ('255,255,255' if j == depth - 1 else
              str(colors[i][0]) + ',' + str(colors[i][1]) + ',' + str(colors[i][2])) + ')"></polygon>')

    for i in range(players):
        points = ""
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.sin(math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize*innerMult)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.cos(math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize*innerMult)
        points += " "
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.sin(math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize/2)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.cos(math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize/2)
        points += " "
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.sin(math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize/2)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.cos(math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize/2)
        points += " "
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.sin(math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize*1.5)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.cos(math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize*1.5)
        print('\t\t<polygon points="' + points +'"stroke="black" stroke-width="' + strokeWidth +'" fill="rgb(' + ('255,255,255' if j != depth -2 else
              str(colors[i][0]) + ',' + str(colors[i][1]) + ',' + str(colors[i][2])) + ')"></polygon>')

    for i in range(players):
        points = ""
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.sin(-math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize*innerMult)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.cos(-math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize*innerMult)
        points += " "
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.sin(-math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize/2)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*outFactor) + math.cos(-math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize/2)
        points += " "
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.sin(-math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize/2)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.cos(-math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize/2)
        points += " "
        points += str(x+math.sin((2*math.pi)*((float(i)/players)))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.sin(-math.pi/2 + (2*math.pi)*(float(i)/players))*size*blockSize*1.5)
        points += ","
        points += str(y+math.cos((2*math.pi)*(float(i)/players))*size*offsetFactor*(2 + offset + blockSize*(outFactor + 1)) + math.cos(-math.pi/2 + (2*math.pi)*((float(i)/players)))*size*blockSize*1.5)
        print('\t\t<polygon points="' + points +'"stroke="black" stroke-width="' + strokeWidth +'" fill="rgb(255,255,255)"></polygon>')
      
    outFactor += 1
print('\t</svg>\n</body>')

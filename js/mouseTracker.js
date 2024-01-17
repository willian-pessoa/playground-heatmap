const normalizeFPS = callback => {
  let ticking = true;
  const update = () => {
    if (ticking) requestAnimationFrame(update);
    ticking = true;
  };
  return event => {
    if (ticking) {
      callback(event);
      update();
    }
    ticking = false;
  };
};

const tranformDataCordinates = (data, sizeAtRecord, sizeScreenToShow) => {
  const scaleX = +(sizeScreenToShow.width / sizeAtRecord.width).toFixed(10)
  const scaleY = +(sizeScreenToShow.height / sizeAtRecord.height).toFixed(10)

  const tranformCordinates = (x, y) => {
    return { x: Math.floor(scaleX * x), y: Math.floor(scaleY * y) }
  }

  const newData = data.map((cordinates) => {
    const newCordinates = tranformCordinates(cordinates.x, cordinates.y)

    return { ...cordinates, x: newCordinates.x, y: newCordinates.y }
  })

  return newData
}

const trackClickstream = () => {
  const mouseTrack = {
    user: "Teste",
    pageUrl: window.location.href,
    windowsSize: {
      height: window.innerHeight,
      width: window.innerWidth,
    },
    startRecordAt: Date.now(),
  }

  const data = []

  // Envia as coordenadas X / Y, Timestamp e tipo de evento
  const pushEventData = ({ pageX, pageY, type, }) => {
    data.push({
      time: Date.now(),
      pageX,
      pageY,

      type,
    });
  };

  document.addEventListener("mousemove", normalizeFPS(pushEventData));
  document.addEventListener("click", pushEventData);

  mouseTrack.data = data

  return mouseTrack
};

let count = 0

// h337 é o nome da função disponibilizada pelo heatmap.js
// external dependencie: heatmap.js
const paintHeatmap = (mouseData, max) => {
  const { height, width } = mouseData.windowsSize

  const heatMapContainer = document.createElement("div");
  heatMapContainer.style.position = "fixed"
  heatMapContainer.style.top = "50%"
  heatMapContainer.style.left = "50%"
  heatMapContainer.style.transform = "translate(-50%, -50%)"
  heatMapContainer.style.width = window.innerWidth - 20 + "px"
  heatMapContainer.style.height = window.innerHeight - 20 + "px"
  heatMapContainer.style.overflow = "scroll"
  heatMapContainer.style.border = "2px solid white"
  heatMapContainer.style.borderRadius = "4px"
  heatMapContainer.style.backgroundColor = "grey"

  const heatMapWrapper = document.createElement("DIV");
  heatMapWrapper.style.width = width + "px"
  heatMapWrapper.style.height = height + "px"
  heatMapWrapper.style.backgroundColor = "yellow"
  heatMapWrapper.style.margin = "0 auto"

  const heatMapIframe = document.createElement("iframe")
  heatMapIframe.setAttribute("src", mouseData.pageUrl)
  heatMapIframe.style.position = "absolute"
  heatMapIframe.style.top = "50%"
  heatMapIframe.style.left = "50%"
  heatMapIframe.style.transform = "translate(-50%, -50%)"
  heatMapIframe.style.width = "100%"
  heatMapIframe.style.height = "100%"
  heatMapIframe.style.overflow = "scroll"


  heatMapContainer.appendChild(heatMapWrapper)
  heatMapWrapper.appendChild(heatMapIframe)
  document.body.appendChild(heatMapContainer)

  // Iniciar o heatmap definindo o container dele
  // estou utilizando a tag HTML que vem de documentElement
  const heatmap = h337.create({
    container: heatMapWrapper,
  });


  const data = mouseData.data

  // Max é o número máximo de pontos para ficar vermelha a área
  // data é uma array de objetos. O objeto deve possui { x: Number, y: Number}
  heatmap.setData({
    data,
    max,
  });

  count++

  return heatmap;
};

// external dependencie: heatmap.js
const paintLive = (data, max) => {
  const heatmap = h337.create({
    container: document.documentElement,
  });
  const update = () => {
    heatmap.setData({
      max,
      data,
    });
    requestAnimationFrame(update);
  };

  setInterval(() => {
    update(data);
  }, 100)
};

const mouseData = trackClickstream()





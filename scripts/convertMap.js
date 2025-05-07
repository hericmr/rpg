const fs = require('fs-extra');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

async function convertMap() {
  try {
    // Ler o arquivo TMX
    const tmxPath = path.resolve(__dirname, '../public/assets/mapa_v2.tmx');
    const jsonPath = path.resolve(__dirname, '../public/assets/mapa_v2.json');
    
    const tmxContent = await fs.readFile(tmxPath, 'utf8');
    
    // Converter XML para JSON
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      parseAttributeValue: true
    });
    
    const tmxData = parser.parse(tmxContent);
    
    // Criar estrutura do mapa
    const mapData = {
      compressionlevel: -1,
      height: tmxData.map.height,
      width: tmxData.map.width,
      infinite: false,
      layers: [],
      nextlayerid: 1,
      nextobjectid: 1,
      orientation: "orthogonal",
      renderorder: "right-down",
      tiledversion: "1.10.1",
      tileheight: 16,
      tilewidth: 16,
      type: "map",
      version: "1.10",
      tilesets: [
        {
          firstgid: 1,
          name: "Room_Builder_free_16x16",
          image: "Room_Builder_free_16x16.png",
          imagewidth: 272,
          imageheight: 368,
          tilewidth: 16,
          tileheight: 16,
          margin: 0,
          spacing: 0,
          columns: 17,
          tilecount: 391,
          tiles: {}
        },
        {
          firstgid: 392,
          name: "Interiors_free_16x16",
          image: "Interiors_free_16x16.png",
          imagewidth: 256,
          imageheight: 1424,
          tilewidth: 16,
          tileheight: 16,
          margin: 0,
          spacing: 0,
          columns: 16,
          tilecount: 1424,
          tiles: {}
        }
      ]
    };

    // Converter camadas
    const layers = Array.isArray(tmxData.map.layer) ? tmxData.map.layer : [tmxData.map.layer];
    mapData.layers = layers.map((layer, index) => {
      const layerData = {
        data: layer.data.split(',').map(Number),
        height: layer.height,
        id: index + 1,
        name: layer.name,
        opacity: layer.opacity || 1,
        type: "tilelayer",
        visible: layer.visible !== false,
        width: layer.width,
        x: layer.x || 0,
        y: layer.y || 0,
        properties: []
      };

      // Adicionar propriedades da camada
      if (layer.properties && layer.properties.property) {
        const properties = Array.isArray(layer.properties.property) ? 
          layer.properties.property : [layer.properties.property];
        
        layerData.properties = properties.map(prop => ({
          name: prop.name,
          type: prop.type || "string",
          value: prop.value
        }));
      }

      return layerData;
    });

    // Adicionar propriedades dos tiles
    mapData.tilesets.forEach(tileset => {
      for (let i = 0; i < tileset.tilecount; i++) {
        tileset.tiles[i] = {
          id: i,
          properties: []
        };
      }
    });

    // Salvar o arquivo JSON
    await fs.writeFile(jsonPath, JSON.stringify(mapData, null, 2));
    console.log('Mapa convertido com sucesso!');
  } catch (error) {
    console.error('Erro ao converter o mapa:', error);
  }
}

convertMap(); 
<template>
  <div class="container">
    <form @submit.prevent>
      <div class="form-group text-left">
        <label for="formfile" class="font-weight-bold">Upload Map Meta Data ( json file )</label>
        <input
          type="file"
          class="form-control-file"
          id="formfile"
          ref="formfile"
        />
        <button
          type="button"
          class="btn btn-outline-primary mt-2"
          @click="parseFile"
        >
          Parse File to Table
        </button>
      </div>
    </form>

    <div class="row">
      <div class="col text-left">
        <p class="font-weight-bold">JSON File Format</p>
        <pre>
[{
  "Name": "map_name_1",
  "Year": "map_year_1",
  "group": "map_topic_1",
  "mapurl": "wmts_url"
},
{
  "Name": "map_name_2",
  "Year": "map_year_2",
  "group": "map_topic_2",
  "mapurl": "wmts_url"
}]
        </pre>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <vue-bootstrap4-table
          ref="mapTable"
          :rows="mapObjectArray"
          :columns="columns"
          :config="config"
        >
        </vue-bootstrap4-table>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <button
          type="button"
          class="btn btn-outline-primary mt-2 float-left mr-2"
          @click="clearSelectedMaps"
        >
          Clear Selected Maps
        </button>
        <button
          type="button"
          class="btn btn-outline-primary mt-2 float-left"
          @click="loadSelectedMaps"
        >
          Load Selected Maps
        </button>
      </div>
      <div class="col">
        <div class="input-group mt-2">
          <div class="input-group-prepend">
            <button
              class="btn btn-outline-primary"
              type="button"
              id="button-addon1"
              @click="locateLatLng"
            >
              Locate LatLng
            </button>
          </div>
          <input
            type="text"
            class="form-control"
            placeholder="lat,lng"
            aria-label="Example text with button addon"
            aria-describedby="button-addon1"
            v-model="currLatLng"
          />
        </div>
      </div>
    </div>

    <div class="row mt-2 mb-5">
      <div class="col">
        <div id="myMap"></div>
      </div>
    </div>
  </div>
</template>

<script>
import VueBootstrap4Table from 'vue-bootstrap4-table';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.control.opacity/dist/L.Control.Opacity.css';
import 'leaflet.control.opacity';
import marker from 'leaflet/dist/images/marker-icon.png';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

/* eslint-disable no-underscore-dangle */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow,
});

export default {
  name: 'HelloWorld',
  props: {
    msg: String,
  },
  components: {
    VueBootstrap4Table,
  },
  mounted() {
    /* eslint-disable new-cap */
    const ostd = new L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      },
    );

    this.myMap = L.map('myMap', {
      center: this.center,
      zoom: this.zoom,
      zoomControl: false,
      layers: [ostd],
    });

    this.baseTileProviders = {
      OSM: ostd,
    };

    this.overlayTileProviders = {};

    this.updateControlLayer();
    this.updateControlOpacity();
  },
  data() {
    return {
      myMap: null,
      controlLayer: null,
      controlOpacity: null,
      controlDraw: null,
      currLatLng: null,
      zoom: 8,
      center: [25.0471641, 121.6067286],
      baseTileProviders: {},
      overlayTileProviders: {},
      mapOptions: {},
      showMap: true,
      mapObjectArray: [],
      columns: [
        {
          label: 'Name',
          name: 'Name',
          filter: {
            type: 'simple',
            placeholder: 'Enter Name',
          },
          sort: true,
        },
        {
          label: 'Year',
          name: 'Year',
          filter: {
            type: 'simple',
            placeholder: 'Enter Year',
          },
          sort: true,
        },
        {
          label: 'Topic',
          name: 'group',
          filter: {
            type: 'simple',
            placeholder: 'Enter Topic',
          },
          sort: true,
        },
      ],
      config: {
        checkbox_rows: true,
        rows_selectable: true,
        card_title: 'File Map Layer',
        show_refresh_button: false,
      },
    };
  },
  methods: {
    test() {
      console.log('test');
    },
    loadSelectedMaps() {
      const selectedMaps = {};
      this.$refs.mapTable.selected_items.forEach((mapObject) => {
        const tmpLayer = new L.tileLayer(mapObject.mapurl, {
          attribution: mapObject.Name,
        });
        selectedMaps[mapObject.Name] = tmpLayer;
      });

      this.overlayTileProviders = selectedMaps;

      this.updateControlLayer();
      this.updateControlOpacity();
    },
    clearSelectedMaps() {
      this.$refs.mapTable.selected_items = [];
      this.loadSelectedMaps();
    },
    updateControlLayer() {
      if (this.controlLayer != null) {
        this.myMap.removeControl(this.controlLayer);
      }
      const drawnItems = L.featureGroup().addTo(this.myMap);
      this.overlayTileProviders.drawlayer = drawnItems;
      this.controlLayer = L.control.layers(
        this.baseTileProviders,
        this.overlayTileProviders,
        {
          collapsed: false,
        },
      );

      this.myMap.addControl(this.controlLayer);

      if (this.controlDraw != null) {
        this.myMap.removeControl(this.controlDraw);
      }

      this.controlDraw = new L.Control.Draw({
        edit: {
          featureGroup: drawnItems,
          poly: {
            allowIntersection: false,
          },
        },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
          },
        },
      });
      this.myMap.addControl(this.controlDraw);

      this.myMap.on(L.Draw.Event.CREATED, (event) => {
        const { layer } = event;
        drawnItems.addLayer(layer);
      });
    },
    updateControlOpacity() {
      if (this.controlOpacity != null) {
        this.myMap.removeControl(this.controlOpacity);
      }
      const tmpOverlayTileProviders = { ...this.overlayTileProviders };
      delete tmpOverlayTileProviders.drawlayer;
      this.controlOpacity = L.control.opacity(tmpOverlayTileProviders, {
        label: 'Layers Opacity',
      });

      this.myMap.addControl(this.controlOpacity);
    },
    parseFile() {
      if (this.$refs.formfile.files.length < 1) {
        alert('Please upload file.');
        return;
      }
      const file = this.$refs.formfile.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        this.text = evt.target.result;
        this.mapObjectArray = JSON.parse(evt.target.result);
      };
      reader.readAsText(file);
    },
    locateLatLng() {
      let latlng = this.currLatLng.split(',');
      latlng = latlng.map((el) => parseFloat(el));
      this.myMap.setView(latlng);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
#myMap {
  height: 70vh;
}
</style>

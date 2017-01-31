/* global document */
import 'normalize.css';

import    HyperbolicEdgeBundles from '../../../../InfoViz/Native/HyperbolicEdgeBundles';
import             ReactAdapter from '../../../../Component/React/ReactAdapter';
import            FieldExplorer from '../../../../InfoViz/React/FieldExplorer';
import     FieldRelationDiagram from '../../../../InfoViz/Native/FieldRelationDiagram';
import       FieldHoverProvider from '../../../../InfoViz/Core/FieldHoverProvider';
import FieldInformationProvider from '../../../../InfoViz/Core/FieldInformationProvider';
import            FieldProvider from '../../../../InfoViz/Core/FieldProvider';
import           LegendProvider from '../../../../InfoViz/Core/LegendProvider';
import      Histogram1DProvider from '../../../../InfoViz/Core/Histogram1DProvider';
import   CompositeClosureHelper from '../../../../Common/Core/CompositeClosureHelper';
import                Workbench from '../../../../Component/Native/Workbench';
import              DataManager from '../../../../IO/Core/DataManager';

import sizeHelper   from '../../../../Common/Misc/SizeHelper';

const container = document.querySelector('.content');
container.style.height = '100vh';
container.style.width = '100vw';
document.querySelector('body').style.overflow = 'hidden'; // Safari otherwise intercepts wheel events

let hyperbolicView = null;
let fieldSMI = null;
let fieldTaylor = null;

const stateUrl = '/paraviewweb/data/dummy/state.json';
const minfoUrl = '/paraviewweb/data/dummy/minfo.demo.json';

// Fetch data (which can be too large for webpack) using a DataManager:
const stateManager = new DataManager();
const minfoManager = new DataManager();
let provider = null;

stateManager.on(stateUrl, (stateData, stateEnvelope) => {
  provider = CompositeClosureHelper.newInstance((publicAPI, model, initialValues = {}) => {
    Object.assign(model, initialValues);
    FieldProvider.extend(publicAPI, model, initialValues);
    FieldHoverProvider.extend(publicAPI, model, initialValues);
    Histogram1DProvider.extend(publicAPI, model, initialValues);
    FieldInformationProvider.extend(publicAPI, model, initialValues);
    LegendProvider.extend(publicAPI, model, initialValues);
  })(stateData.data);
  provider.setFieldsSorted(true);
  provider.getFieldNames().forEach((name) => {
    provider.addLegendEntry(name);
  });
  provider.assignLegend(['colors', 'shapes']);

  hyperbolicView = HyperbolicEdgeBundles.newInstance({ provider });
  fieldSMI = FieldRelationDiagram.newInstance({ provider, diagramType: 'smi' });
  fieldTaylor = FieldRelationDiagram.newInstance({ provider, diagramType: 'taylor' });

  const fieldExplorerProps = {
    sortDirection: 'down',
    disposition: null,
    subject: provider.getFieldNames()[0],
    fieldInfo: null,
  };

  const fieldExplorer = new ReactAdapter(FieldExplorer, { provider, getRenderProps: () => fieldExplorerProps });

  // fieldSelector can be sorted using any numeric array
  provider.subscribeToFieldInformation((info) => {
    fieldExplorerProps.fieldInfo = info;
    fieldExplorer.render();
  });
  provider.onHoverFieldChange((hover) => {
    if (hover.state.subject) {
      fieldExplorerProps.subject = hover.state.subject;
      fieldExplorerProps.disposition = hover.state.disposition;
      fieldExplorer.render();
    }
  });

  const viewports = {
    HyperbolicEdgeBundles: {
      component: hyperbolicView,
      viewport: 0,
    },
    FieldExplorer: {
      component: fieldExplorer,
      viewport: 1,
    },
    TaylorDiagram: {
      component: fieldSMI,
      viewport: 2,
    },
    SMIDiagram: {
      component: fieldTaylor,
      viewport: 3,
    },
  };

  const workbench = new Workbench();
  workbench.setComponents(viewports);
  workbench.setLayout('2x2');

  workbench.setContainer(container);

  // Listen to window resize
  sizeHelper.onSizeChange(() => {
    workbench.resize();
  });
  sizeHelper.startListening(50);

  sizeHelper.triggerChange();

  minfoManager.fetchURL(minfoUrl, 'json');
});

minfoManager.on(minfoUrl, (data, envelope) => {
  console.log('loaded data ', data, ' from ', minfoUrl);
  const minfo = data.data.mutualInformation;
  const fieldKeys = Object.keys(data.data.fieldMapping);
  const vars = new Array(fieldKeys.length);
  fieldKeys.forEach((key) => {
    vars[data.data.fieldMapping[key].id] = data.data.fieldMapping[key];
    // We assigned legend entries above, but only for fields listed by the FieldProvider.
    // Our demo hacks more variables into FieldInformation, so add legend entries for those, too.
    // TODO: Be consistent with FieldProvider.
    if (!provider.getLegend(key)) {
      provider.addLegendEntry(key);
    }
  });

  const entropyArray = [];
  for (let i = 0; i < minfo.length; i += 1) {
    entropyArray.push(minfo[i][i]);
  }

  provider.setFieldInformation({
    fieldMapping: vars,
    mutualInformation: minfo,
    entropy: entropyArray,
    smiTheta: data.data.theta,
    taylorPearson: data.data.taylorPearson,
    taylorTheta: data.data.taylorTheta,
    taylorR: data.data.taylorStdDev,
  });
});

stateManager.fetchURL(stateUrl, 'json');

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------
global.hyperbolicView = hyperbolicView;
global.fieldSMI = fieldSMI;
global.fieldTaylor = fieldTaylor;
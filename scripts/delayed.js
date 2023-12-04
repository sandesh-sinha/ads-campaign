// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here

export function sendAnalyticsEvent(capturedData) {
  const data = {
    'event.type': capturedData.type,
    'event.coll_dts': capturedData.start,
    'event.dts_start': capturedData.start,
    'content.type': capturedData.contentType,
    'content.action': capturedData.action,
    'trn.product': capturedData.action,
    'trn.amount': capturedData.amount,
    'event.dts_end': capturedData.end,
    'event.count': capturedData.count,
    'event.value': capturedData.value,
    'trn.quantity': capturedData.quantity,
    'event.subtype': capturedData.subType
  };
  console.log(data);
  window.parent.postMessage(JSON.stringify({
    namespace: 'screens-player',
    type: 'analytics-tracking-event',
    data,
  }),"*");
}

let campaignTimeout;
let currentCampaign = 0;
let assetTimeout = 0;
const DURATION = 5000;
let currentAsset;
let assetActivateTime;
let assetDeactivateTime;

function activateNextAsset(asset) {
  assetActivateTime = (new Date()).toISOString();
  if (!asset.classList.contains('active')) {
    asset.classList.add('active');
  }
}

function deactivateCurrentAsset(asset) {
  if (asset.classList.contains('active')) {
    asset.classList.remove('active');
  }
}

function deactivateCurrentCampaign(campaign) {
  console.log('deactivating campaign');
  if (campaign.classList.contains('active')) {
    campaign.classList.remove('active');
  }
}

function handleAssetTransition(sequence, leftSlots) {
  const campaign = sequence.children[currentCampaign];
  deactivateCurrentAsset(campaign.children[currentAsset]);
  assetDeactivateTime = (new Date()).toISOString();
  const assetURL = campaign.children[currentAsset].children[0].src;
  const assetId = assetURL.split('/')[assetURL.split('/').length - 1];
  const duration = ((new Date(assetDeactivateTime)).getTime() - (new Date(assetActivateTime)).getTime());
  sendAnalyticsEvent({
    type: 'play',
    start: assetActivateTime,
    end: assetDeactivateTime,
    value: 'Played asset with id ' + assetId + ' for ' + duration + 'ms' + ' in campaign ' + campaign.dataset.id + ' for customer ' + campaign.dataset.customer,
    action: 'play',
    quantity: duration,
    contentType: 'Image',
    count: 1,
    subType: 'end',
    amount: 0
  });
  currentAsset += 1;
  if (currentAsset === campaign.childElementCount) {
    currentAsset = 0;
  }
  leftSlots -= 1;
  if (leftSlots === 0) {
    clearTimeout(assetTimeout);
    campaign.dataset.nextplay = currentAsset;
    deactivateCurrentCampaign(campaign);
    currentCampaign += 1;
    if (currentCampaign === sequence.childElementCount) {
      currentCampaign = 0;
    }
    activateNextCampaign(sequence);
    return;
  }
  activateNextAsset(campaign.children[currentAsset]);
  assetTimeout = setTimeout(handleAssetTransition, DURATION, sequence, leftSlots);
}

function activateNextCampaign(sequence) {
  const campaign = sequence.children[currentCampaign];
  const alottedslots = sequence.children[currentCampaign].dataset.allotedslots
  if (!campaign.classList.contains('active')) {
    campaign.classList.add('active');
    currentAsset = campaign.dataset.nextplay ? Number(campaign.dataset.nextplay) : 0 ;
    activateNextAsset(campaign.children[currentAsset]);
    assetTimeout = setTimeout(handleAssetTransition, DURATION, sequence, alottedslots);
  }
}

function startCarousel() {
  const carousels = document.querySelectorAll('.sequence');
  if (carousels.length === 0) {
    console.log('no sequence registered');
    return;
  }
  const sequence = carousels[0];
  currentCampaign = 0;
  activateNextCampaign(sequence);
}

startCarousel();
// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here

function sendAnalyticsEvent(capturedData) {
  const data = {
    'event.type': capturedData.type,
    'event.coll_dts': capturedData.start,
    'event.dts_start': capturedData.start,
    'content.type': capturedData.contentType,
    'content.action': capturedData.action,
    'trn.product': capturedData.product,
    'trn.amount': capturedData.amount,
    'event.dts_end': capturedData.end,
    'event.count': capturedData.count,
    'event.value': capturedData.value,
    'trn.quantity': capturedData.quantity,
    'event.subtype': capturedData.subType,
  };
  console.log(data);
  window.parent.postMessage(JSON.stringify({
    namespace: 'screens-player',
    type: 'analytics-tracking-event',
    data,
  }), '*');
}

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

function checkCampaignActivation(campaign) {
  const startDate = Number(campaign.dataset.startdate);
  const endDate = Number(campaign.dataset.enddate);
  const currentDate = (new Date()).getTime();
  const isActive = ((currentDate >= (new Date(startDate)).getTime())
    && (currentDate <= (new Date(endDate)).getTime()));
  return isActive;
}

function increment(previousIndex, sequence) {
  let index = previousIndex;
  index += 1;
  if (index === sequence.childElementCount) {
    index = 0;
  }
  return index;
}

function handlePreviousCampaign(sequence) {
  // handle previous campaign
  const campaign = sequence.children[currentCampaign];
  clearTimeout(assetTimeout);
  campaign.dataset.nextplay = currentAsset;
  deactivateCurrentCampaign(campaign);
}

function handleNextCampaign(sequence) {
  // handle next campaign
  const activeCampaigns = Array.from(sequence.children)
    .filter((campaignElem) => checkCampaignActivation(campaignElem));
  if (activeCampaigns.length === 0) {
    console.log('no active campaigns');
    return;
  }
  let targetCampaignIndex = increment(currentCampaign, sequence);
  let campaignRetrieved = false;
  Array.from(sequence.children).splice(targetCampaignIndex).every((campaignElem) => {
    if (checkCampaignActivation(campaignElem)) {
      campaignRetrieved = true;
      return false;
    }
    targetCampaignIndex = increment(targetCampaignIndex, sequence);
    return true;
  });
  if (!campaignRetrieved) {
    Array.from(sequence.children).splice(0, currentCampaign + 1).every((campaignElem) => {
      if (checkCampaignActivation(campaignElem)) {
        campaignRetrieved = true;
        return false;
      }
      targetCampaignIndex = increment(targetCampaignIndex, sequence);
      return true;
    });
  }
  if (!campaignRetrieved) {
    console.log('unable to find active campaigns');
    return;
  }
  console.log('activating next campaign', currentCampaign, ' to ', targetCampaignIndex);
  currentCampaign = targetCampaignIndex;
  // eslint-disable-next-line no-use-before-define
  activateNextCampaign(sequence);
}

function handleCampaignTransition(sequence) {
  // handle previous campaign
  handlePreviousCampaign(sequence);
  // handle next campaign
  handleNextCampaign(sequence);
}

function handleAssetTransition(sequence, leftSlots) {
  const campaign = sequence.children[currentCampaign];
  deactivateCurrentAsset(campaign.children[currentAsset]);
  assetDeactivateTime = (new Date()).toISOString();
  const assetURL = campaign.children[currentAsset].children[0].src;
  const assetId = assetURL.split('/')[assetURL.split('/').length - 1];
  const duration = ((new Date(assetDeactivateTime)).getTime()
    - (new Date(assetActivateTime)).getTime());
  sendAnalyticsEvent({
    type: 'campaign',
    start: assetActivateTime,
    end: assetDeactivateTime,
    value: assetId,
    action: 'play',
    quantity: duration,
    contentType: campaign.dataset.id,
    product: campaign.dataset.customer,
    count: 1,
    subType: 'end',
    amount: 0,
  });
  currentAsset += 1;
  if (currentAsset === campaign.childElementCount) {
    currentAsset = 0;
  }
  const updatedLeftSlots = leftSlots - 1;
  const isactive = checkCampaignActivation(campaign);
  if (leftSlots === 0 || !isactive) {
    handleCampaignTransition(sequence);
    return;
  }
  activateNextAsset(campaign.children[currentAsset]);
  assetTimeout = setTimeout(handleAssetTransition, DURATION, sequence, updatedLeftSlots);
}

function activateNextCampaign(sequence) {
  const campaign = sequence.children[currentCampaign];
  const alottedslots = sequence.children[currentCampaign].dataset.allotedslots;
  if (!campaign.classList.contains('active')) {
    campaign.classList.add('active');
    currentAsset = campaign.dataset.nextplay ? Number(campaign.dataset.nextplay) : 0;
    activateNextAsset(campaign.children[currentAsset]);
    assetTimeout = setTimeout(handleAssetTransition, DURATION, sequence, alottedslots - 1);
  }
}

function startCarousel() {
  const carousels = document.querySelectorAll('.sequence');
  if (carousels.length === 0) {
    console.log('no sequence registered');
    return;
  }
  const sequence = carousels[0];
  currentCampaign = -1;
  handleNextCampaign(sequence);
  console.log('sequence started');
}

startCarousel();

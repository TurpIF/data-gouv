print("Reading data...")
data <- read.csv("./Knime datasets/PolicesTEMP.csv", header = T,  stringsAsFactors = F)
epd <- read.csv("./Knime datasets/EffectifsPnGnGt.csv", header = T,  sep = "\t",  stringsAsFactors = F)
popD <- read.csv("./Knime datasets/PopParDept2013.csv", header = T,  sep = "\t",  stringsAsFactors = F)
popV <- read.csv("./Knime datasets/popfr2010.csv", header = T,  sep = "\t",  stringsAsFactors = F)
print("Sorting by type...")
PN <- data[data$Type == "PN",]
PM <- data[data$Type == "PM",]
G <- data[data$Type == "G",]
print("Computing ratios...")
tot <- length(unique(data$Ville))
cur <- 0
last <- 0.
ppV <- data.frame(matrix(vector(), 0, 4, dimnames=list(c(), c("Ville", "npPN", "npG", "npPM"))), stringsAsFactors=F)
ppdD <- data.frame(matrix(vector(), 0, 2, dimnames=list(c(), c("Ville", "pPop"))), stringsAsFactors=F)
for (i in data$Ville) {
	ratio <- cur/tot
	cur <- cur + 1
	if (ratio >= last) {
		print(paste(last,"%"))
		last <- last + 5.
	}
	ppV[i,] <- c(i, nrow(PN[PN$Ville == i,]), nrow(G[G$Ville == i,]), nrow(PM[PM$Ville == i,]))
	ville <- popV[popV$com_nom == i, ]
	ppdD[i,] <- c(i, as.numeric(ville[, "pop_2010"])/popD[popD$Dept == ville$dep, "Pop"])
}
print("Computing manpower...")
tot <- nrow(data)
cur <- 0
last <- 0.
final <- data.frame(matrix(vector(), 0, 9, dimnames=list(c(), c("long", "lat", "Type", "Adresse", "CP", "Ville", "nDept", "nReg", "Effectif"))), stringsAsFactors=F)
for (i in 1:nrow(data)) {
	ratio <- cur/tot
	cur <- cur + 1
	if (ratio >= last) {
		print(paste(last,"%"))
		last <- last + 5.
	}
	poste <- data[i,]
	# 1/(nbPostesDuTypeDsVille)*(partPopVilleDept)*(EffectifDuTypeDsDept)
	effectif <- if (poste$Type == "G"){
		tmp <- 2*round(1.5*(1/as.numeric(ppV[ppV$Ville == poste$Ville, "npG"]))*as.numeric(ppdD[ppdD$Ville == poste$Ville, "pPop"])*(poste$gd2013)+1)
		ifelse(is.na(tmp), sample(4:10,1), tmp)
	} else if (poste$Type == "PM") {
		poste$Effectif
	} else if (poste$Type == "PN") {
		# 5*as.numeric(ppdD[ppdD$Ville == poste$Ville, "pPop"])
		tmp <- round((1/as.numeric(ppV[ppV$Ville == poste$Ville, "npPN"]))*(poste$pn2013)+1)
		ifelse(is.na(tmp), sample(15:55,1), tmp)
	}
	final[i,] <- c(poste$Longitude,poste$Latitude,poste$Type,poste$Adresse,poste$CP,poste$Ville,poste$noDept,poste$noReg,effectif)
}
print("Writing output...")
write.csv(final, file = "./Knime datasets/effectif.csv",row.names=F, na="")
print("Done.")

# library(maps)
# map("france")
# points(base$long,base$lat,cex=.1,col="red",pch=19)
# points(base$long,base$lat,cex=2*base$pop_2010/max(base$pop_2010),col="blue",pch=19)